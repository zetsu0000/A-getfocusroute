import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { jsonInputError, readJsonObject } from "@/lib/api/request";
import {
  isResultEmailSendingEnabled,
  isResultEmailTransactionalTriggerEnabled,
} from "@/lib/email/config";
import { sendResultEmail } from "@/lib/email/result-email-service";
import {
  enforceRateLimit,
  rateLimitResponse,
  temporaryUnavailableResponse,
} from "@/lib/rate-limit/server";

const GENERIC_RESPONSE = {
  ok: true,
  message: "If this request can be processed, you will receive an email shortly.",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  try {
    const parsed = await readJsonObject(request, {
      maxBytes: 4 * 1024,
      requireJsonContentType: true,
    });
    if (!parsed.ok) return jsonInputError(parsed);

    const resultId =
      typeof parsed.body.resultId === "string" ? parsed.body.resultId.trim() : "";
    const validResultId = isUuid(resultId);

    const preAuthLimit = await enforceRateLimit("resultEmailRequestPreAuth", {
      request,
      resultId: validResultId ? resultId : null,
    });
    if (!preAuthLimit.ok) {
      if (preAuthLimit.kind === "limited") return rateLimitResponse(preAuthLimit);
      return temporaryUnavailableResponse();
    }

    if (!validResultId) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    const authenticatedLimit = await enforceRateLimit("resultEmailRequestAuthenticated", {
      request,
      userId: user.id,
    });
    if (!authenticatedLimit.ok) {
      if (authenticatedLimit.kind === "limited") return rateLimitResponse(authenticatedLimit);
      return temporaryUnavailableResponse();
    }

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("quiz_results")
      .select("*")
      .eq("id", resultId)
      .maybeSingle();

    if (error || !row) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    if (!row.user_id || row.user_id !== user.id) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    if (
      !isResultEmailTransactionalTriggerEnabled() ||
      !isResultEmailSendingEnabled()
    ) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    await sendResultEmail(
      {
        quizRow: row,
        recipientSource: {
          kind: "authenticated_user",
          userId: user.id,
          email: user.email,
        },
      },
      undefined,
      { category: "transactional" },
    );

    return Response.json(GENERIC_RESPONSE, { status: 202 });
  } catch {
    return Response.json(GENERIC_RESPONSE, { status: 202 });
  }
}

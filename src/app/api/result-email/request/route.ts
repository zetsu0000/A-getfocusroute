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
    if (!isUuid(resultId)) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    const limit = await enforceRateLimit("resultEmailRequest", {
      request,
      resultId,
      userId: null,
    });
    if (!limit.ok) {
      if (limit.kind === "limited") return rateLimitResponse(limit);
      return temporaryUnavailableResponse();
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    const userLimit = await enforceRateLimit("resultEmailRequest", {
      request,
      resultId,
      userId: user.id,
    });
    if (!userLimit.ok) {
      if (userLimit.kind === "limited") return rateLimitResponse(userLimit);
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

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { jsonInputError, readJsonObject } from "@/lib/api/request";
import {
  getConfiguredEmailProviderName,
  getResultEmailFromAddress,
  isResultEmailSendingEnabled,
  isResultEmailTransactionalTriggerEnabled,
  validateProductionEmailConfiguration,
} from "@/lib/email/config";
import { verifyGuestResultEmailToken } from "@/lib/email/guest-result-token";
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

function genericResponse(): Response {
  // One generic body for every outcome (no recipient, forged token, disabled
  // flag, or success) so the endpoint never confirms whether a resultId exists,
  // has an email, or matches the caller.
  return Response.json(GENERIC_RESPONSE, { status: 202 });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function transactionalSendingReady(): boolean {
  return (
    isResultEmailTransactionalTriggerEnabled() && isResultEmailSendingEnabled()
  );
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const parsed = await readJsonObject(request, {
      maxBytes: 4 * 1024,
      requireJsonContentType: true,
    });
    if (!parsed.ok) return jsonInputError(parsed);

    const resultId = stringField(parsed.body.resultId);
    const token = stringField(parsed.body.token);
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
      return genericResponse();
    }

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("quiz_results")
      .select("*")
      .eq("id", resultId)
      .maybeSingle();

    if (error || !row) {
      return genericResponse();
    }

    // ── Guest path ──────────────────────────────────────────────────────────
    // No owning account + a signed proof token. The recipient is read from the
    // stored row (never the request), and the token proves the caller created
    // this result. No login required; resultId guessing yields no valid token.
    if (!row.user_id && token) {
      const rowEmail = stringField(row.email);
      const proven = verifyGuestResultEmailToken(token, resultId, rowEmail);
      // TEMP DIAGNOSTIC (header-gated, secret-free): surfaces which production
      // gate is closing the guest send. Remove after launch validation.
      if (request.headers.get("x-fr-debug") === "1") {
        console.warn("[result-email-debug]", {
          proven,
          trigger_enabled: isResultEmailTransactionalTriggerEnabled(),
          sending_enabled: isResultEmailSendingEnabled(),
          provider: getConfiguredEmailProviderName(),
          from_present: Boolean(getResultEmailFromAddress()),
          config: validateProductionEmailConfiguration(),
          node_env: process.env.NODE_ENV,
        });
      }
      if (proven && transactionalSendingReady()) {
        await sendResultEmail(
          {
            quizRow: row,
            recipientSource: {
              kind: "submitted_quiz_result_email",
              resultId,
              email: rowEmail,
              explicitDeliveryRequest: true,
            },
          },
          undefined,
          { category: "transactional" },
        );
      }
      return genericResponse();
    }

    // ── Authenticated path ────────────────────────────────────────────────────
    // Account-owned result: authorized by Supabase session + row ownership.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return genericResponse();
    }

    const authenticatedLimit = await enforceRateLimit("resultEmailRequestAuthenticated", {
      request,
      userId: user.id,
    });
    if (!authenticatedLimit.ok) {
      if (authenticatedLimit.kind === "limited") return rateLimitResponse(authenticatedLimit);
      return temporaryUnavailableResponse();
    }

    if (!row.user_id || row.user_id !== user.id) {
      return genericResponse();
    }

    if (transactionalSendingReady()) {
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
    }

    return genericResponse();
  } catch {
    return genericResponse();
  }
}

import "server-only";

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import type { ResultEmailPayload } from "@/lib/email/types";

export type ResultEmailAnalyticsStage = "requested" | "sent" | "failed";

const EVENT_BY_STAGE = {
  requested: FIRST_PARTY_EVENTS.resultEmailRequested,
  sent: FIRST_PARTY_EVENTS.resultEmailSent,
  failed: FIRST_PARTY_EVENTS.resultEmailFailed,
} as const;

export function buildResultEmailAnalyticsMetadata(
  payload: ResultEmailPayload,
  input: {
    failureStage?: string;
    safeErrorCode?: string | null;
    provider?: string;
    patternMismatch?: boolean;
  } = {},
): Record<string, string | number | boolean | null> {
  return {
    email_type: payload.emailType,
    template_version: payload.idempotencyKey.split(":").pop() ?? "1",
    pattern_key: payload.patternKey,
    has_score: payload.focusFrictionScore != null,
    pattern_mismatch: input.patternMismatch ?? false,
    failure_stage: input.failureStage ?? null,
    safe_error_code: input.safeErrorCode ?? null,
    provider: input.provider ?? null,
  };
}

export async function trackResultEmailAnalytics(
  stage: ResultEmailAnalyticsStage,
  payload: ResultEmailPayload,
  input: {
    userId?: string | null;
    failureStage?: string;
    safeErrorCode?: string | null;
    provider?: string;
    patternMismatch?: boolean;
  } = {},
): Promise<void> {
  try {
    await recordAnalyticsEvent({
      event_name: EVENT_BY_STAGE[stage],
      user_id: input.userId ?? null,
      metadata: buildResultEmailAnalyticsMetadata(payload, input),
    });
  } catch {
    // Analytics must not block delivery orchestration.
  }
}

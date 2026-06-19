import "server-only";

import {
  getConfiguredEmailProviderName,
  isMockProviderAllowed,
  isRealEmailProviderName,
  isResultEmailSendingEnabled,
  validateProductionEmailConfiguration,
} from "@/lib/email/config";
import type { EmailDeliveryLedger } from "@/lib/email/delivery-ledger";
import { InMemoryEmailDeliveryLedger } from "@/lib/email/delivery-ledger";
import {
  MockResultEmailProvider,
  NoopResultEmailProvider,
} from "@/lib/email/providers/mock-provider";
import {
  buildPlaceholderResultEmailMessage,
  type ResultEmailProvider,
} from "@/lib/email/providers/types";
import {
  assertResultEmailPayloadSafe,
  buildResultEmailPayload,
} from "@/lib/email/result-email-payload";
import { trackResultEmailAnalytics } from "@/lib/email/result-email-analytics";
import type {
  ResultEmailBuildInput,
  ResultEmailMessage,
  ResultEmailRecipientSource,
  SendResultEmailOptions,
  SendResultEmailResult,
} from "@/lib/email/types";
import { normalizeRecipientEmail } from "@/lib/email/validation";

export type ResultEmailServiceDeps = {
  ledger?: EmailDeliveryLedger;
  provider?: ResultEmailProvider;
  sendingEnabled?: () => boolean;
  trackAnalytics?: boolean;
};

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function invalidResult(
  safeErrorCode: string,
  provider = "none",
): SendResultEmailResult {
  return {
    status: "skipped_invalid",
    idempotencyKey: "",
    provider,
    safeErrorCode,
  };
}

/** Validates server-side recipient sources — guest email is submitted, not verified. */
export function resolveResultEmailRecipient(
  source: ResultEmailRecipientSource,
  quizRow: Record<string, unknown>,
): string | null {
  const rowEmail = normalizeRecipientEmail(stringField(quizRow.email));
  const rowId = stringField(quizRow.id);
  const rowUserId = stringField(quizRow.user_id);

  if (source.kind === "authenticated_user") {
    const email = normalizeRecipientEmail(source.email);
    if (!email) return null;
    if (!rowUserId || rowUserId !== source.userId) return null;
    if (rowEmail && rowEmail !== email) return null;
    return email;
  }

  if (source.kind === "submitted_quiz_result_email") {
    if (rowUserId) return null;
    if (!source.explicitDeliveryRequest) return null;
    const email = normalizeRecipientEmail(source.email);
    if (!email || !rowId || rowId !== source.resultId) return null;
    if (rowEmail && rowEmail !== email) return null;
    return email;
  }

  return null;
}

export function assertMarketingEmailAllowed(category: SendResultEmailOptions["category"]): void {
  if (category && category !== "transactional") {
    throw new Error("result_email_marketing_not_allowed");
  }
}

export function createResultEmailProvider(): ResultEmailProvider {
  const configured = getConfiguredEmailProviderName();
  if (configured === "mock" && isMockProviderAllowed()) {
    return new MockResultEmailProvider();
  }
  return new NoopResultEmailProvider();
}

let defaultLedger: EmailDeliveryLedger | null = null;

function getDefaultLedger(): EmailDeliveryLedger {
  if (!defaultLedger) {
    defaultLedger = new InMemoryEmailDeliveryLedger();
  }
  return defaultLedger;
}

function resolveMessage(
  provider: ResultEmailProvider,
  payload: import("@/lib/email/types").ResultEmailPayload,
  message: ResultEmailMessage | undefined,
): ResultEmailMessage | { error: string } {
  if (message) return message;
  if (provider.name === "mock") {
    return buildPlaceholderResultEmailMessage(payload);
  }
  return { error: "message_not_configured" };
}

/**
 * Sends a transactional result email through the provider-agnostic service boundary.
 * Disabled by default via RESULT_EMAIL_SENDING_ENABLED.
 */
export async function sendResultEmail(
  buildInput: Omit<ResultEmailBuildInput, "recipientEmail"> & {
    recipientSource: ResultEmailRecipientSource;
  },
  message?: ResultEmailMessage,
  options: SendResultEmailOptions = {},
  deps: ResultEmailServiceDeps = {},
): Promise<SendResultEmailResult> {
  assertMarketingEmailAllowed(options.category ?? "transactional");

  const recipientEmail = resolveResultEmailRecipient(
    buildInput.recipientSource,
    buildInput.quizRow,
  );
  if (!recipientEmail) {
    return invalidResult("invalid_recipient_source");
  }

  let built;
  try {
    built = buildResultEmailPayload({
      ...buildInput,
      recipientEmail,
      locale: options.locale ?? buildInput.locale,
      templateVersion: options.templateVersion ?? buildInput.templateVersion,
    });
  } catch {
    return invalidResult("invalid_result_payload");
  }

  const { payload, patternMismatch } = built;
  assertResultEmailPayloadSafe(payload);

  const configValidation = validateProductionEmailConfiguration();
  if (!configValidation.ok) {
    return invalidResult(configValidation.safeErrorCode);
  }

  const sendingEnabled = deps.sendingEnabled ?? isResultEmailSendingEnabled;
  if (!sendingEnabled()) {
    return {
      status: "skipped_disabled",
      idempotencyKey: payload.idempotencyKey,
      provider: "none",
    };
  }

  const ledger = deps.ledger ?? getDefaultLedger();
  const provider = deps.provider ?? createResultEmailProvider();
  const trackAnalytics = deps.trackAnalytics ?? true;
  const userId =
    buildInput.recipientSource.kind === "authenticated_user"
      ? buildInput.recipientSource.userId
      : null;

  const claim = await ledger.claim({
    idempotencyKey: payload.idempotencyKey,
    emailType: "transactional",
    resultId: payload.resultId,
    userId,
    provider: provider.name,
  });

  if (claim.status === "duplicate") {
    return {
      status: "skipped_duplicate",
      idempotencyKey: payload.idempotencyKey,
      provider: claim.record.provider,
      providerMessageId: claim.record.providerMessageId,
    };
  }

  if (claim.status === "in_progress") {
    return {
      status: "skipped_in_progress",
      idempotencyKey: payload.idempotencyKey,
      provider: claim.record.provider,
      providerMessageId: claim.record.providerMessageId,
    };
  }

  if (trackAnalytics) {
    await trackResultEmailAnalytics("requested", payload, {
      userId,
      provider: provider.name,
      patternMismatch,
    });
  }

  if (provider.name === "noop") {
    await ledger.markFailed({
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      lastErrorCode: "provider_not_configured",
    });
    if (trackAnalytics) {
      await trackResultEmailAnalytics("failed", payload, {
        userId,
        provider: provider.name,
        failureStage: "provider_selection",
        safeErrorCode: "provider_not_configured",
        patternMismatch,
      });
    }
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: "provider_not_configured",
    };
  }

  const resolvedMessage = resolveMessage(provider, payload, message);
  if ("error" in resolvedMessage) {
    await ledger.markFailed({
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      lastErrorCode: resolvedMessage.error,
    });
    if (trackAnalytics) {
      await trackResultEmailAnalytics("failed", payload, {
        userId,
        provider: provider.name,
        failureStage: "message_validation",
        safeErrorCode: resolvedMessage.error,
        patternMismatch,
      });
    }
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: resolvedMessage.error,
    };
  }

  let sendResult;
  try {
    sendResult = await provider.send(payload, resolvedMessage);
  } catch {
    await ledger.markFailed({
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      lastErrorCode: "provider_exception",
    });
    if (trackAnalytics) {
      await trackResultEmailAnalytics("failed", payload, {
        userId,
        provider: provider.name,
        failureStage: "provider_send",
        safeErrorCode: "provider_exception",
        patternMismatch,
      });
    }
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: "provider_exception",
    };
  }

  if (!sendResult.ok) {
    await ledger.markFailed({
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      lastErrorCode: sendResult.safeErrorCode,
    });
    if (trackAnalytics) {
      await trackResultEmailAnalytics("failed", payload, {
        userId,
        provider: provider.name,
        failureStage: "provider_send",
        safeErrorCode: sendResult.safeErrorCode,
        patternMismatch,
      });
    }
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: sendResult.safeErrorCode,
    };
  }

  if (provider.name === "mock") {
    await ledger.markPreviewed({
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      providerMessageId: sendResult.providerMessageId,
    });
    return {
      status: "previewed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      providerMessageId: sendResult.providerMessageId,
    };
  }

  if (!isRealEmailProviderName(provider.name)) {
    await ledger.markFailed({
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      lastErrorCode: "provider_not_configured",
    });
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: "provider_not_configured",
    };
  }

  await ledger.markSent({
    idempotencyKey: payload.idempotencyKey,
    provider: provider.name,
    providerMessageId: sendResult.providerMessageId,
  });

  if (trackAnalytics) {
    await trackResultEmailAnalytics("sent", payload, {
      userId,
      provider: provider.name,
      patternMismatch,
    });
  }

  return {
    status: "sent",
    idempotencyKey: payload.idempotencyKey,
    provider: provider.name,
    providerMessageId: sendResult.providerMessageId,
  };
}

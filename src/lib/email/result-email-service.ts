import "server-only";

import {
  getConfiguredEmailProviderName,
  isResultEmailSendingEnabled,
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
  SendResultEmailOptions,
  SendResultEmailResult,
  TrustedRecipientSource,
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

/** Validates that the recipient email comes from an approved server-side source. */
export function resolveTrustedRecipientEmail(
  source: TrustedRecipientSource,
  quizRow: Record<string, unknown>,
): string | null {
  const rowEmail = normalizeRecipientEmail(stringField(quizRow.email));
  const rowId = stringField(quizRow.id);

  if (source.kind === "authenticated_user") {
    const email = normalizeRecipientEmail(source.email);
    if (!email) return null;
    if (rowEmail && rowEmail !== email) return null;
    return email;
  }

  const email = normalizeRecipientEmail(source.email);
  if (!email || !rowId || rowId !== source.resultId) return null;
  if (rowEmail && rowEmail !== email) return null;
  return email;
}

export function assertMarketingEmailAllowed(category: SendResultEmailOptions["category"]): void {
  if (category && category !== "transactional") {
    throw new Error("result_email_marketing_not_allowed");
  }
}

export function createResultEmailProvider(): ResultEmailProvider {
  const configured = getConfiguredEmailProviderName();
  if (configured === "mock") {
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

/**
 * Sends a transactional result email through the provider-agnostic service boundary.
 * Disabled by default via RESULT_EMAIL_SENDING_ENABLED.
 */
export async function sendResultEmail(
  buildInput: Omit<ResultEmailBuildInput, "recipientEmail"> & {
    trustedRecipient: TrustedRecipientSource;
  },
  message?: ResultEmailMessage,
  options: SendResultEmailOptions = {},
  deps: ResultEmailServiceDeps = {},
): Promise<SendResultEmailResult> {
  assertMarketingEmailAllowed(options.category ?? "transactional");

  const recipientEmail = resolveTrustedRecipientEmail(
    buildInput.trustedRecipient,
    buildInput.quizRow,
  );
  if (!recipientEmail) {
    return {
      status: "skipped_invalid",
      idempotencyKey: "",
      provider: "none",
      safeErrorCode: "invalid_recipient_source",
    };
  }

  const payload = buildResultEmailPayload({
    ...buildInput,
    recipientEmail,
    locale: options.locale ?? buildInput.locale,
    templateVersion: options.templateVersion ?? buildInput.templateVersion,
  });
  assertResultEmailPayloadSafe(payload);

  const resolvedMessage = message ?? buildPlaceholderResultEmailMessage(payload);

  const ledger = deps.ledger ?? getDefaultLedger();
  const provider = deps.provider ?? createResultEmailProvider();
  const sendingEnabled = deps.sendingEnabled ?? isResultEmailSendingEnabled;
  const trackAnalytics = deps.trackAnalytics ?? true;
  const userId =
    buildInput.trustedRecipient.kind === "authenticated_user"
      ? buildInput.trustedRecipient.userId
      : null;

  const existing = await ledger.findByIdempotencyKey(payload.idempotencyKey);
  if (existing && (existing.status === "sent" || existing.status === "skipped_duplicate")) {
    return {
      status: "skipped_duplicate",
      idempotencyKey: payload.idempotencyKey,
      provider: existing.provider,
      providerMessageId: existing.providerMessageId,
    };
  }

  if (trackAnalytics) {
    await trackResultEmailAnalytics("requested", payload, {
      userId,
      provider: provider.name,
    });
  }

  if (!sendingEnabled()) {
    await ledger.upsert({
      idempotencyKey: payload.idempotencyKey,
      emailType: "transactional",
      resultId: payload.resultId,
      userId,
      provider: provider.name,
      status: "skipped_disabled",
    });
    return {
      status: "skipped_disabled",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
    };
  }

  if (provider.name === "noop") {
    await ledger.upsert({
      idempotencyKey: payload.idempotencyKey,
      emailType: "transactional",
      resultId: payload.resultId,
      userId,
      provider: provider.name,
      status: "failed",
      lastErrorCode: "provider_not_configured",
    });
    if (trackAnalytics) {
      await trackResultEmailAnalytics("failed", payload, {
        userId,
        provider: provider.name,
        failureStage: "provider_selection",
        safeErrorCode: "provider_not_configured",
      });
    }
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: "provider_not_configured",
    };
  }

  await ledger.upsert({
    idempotencyKey: payload.idempotencyKey,
    emailType: "transactional",
    resultId: payload.resultId,
    userId,
    provider: provider.name,
    status: "pending",
  });

  const sendResult = await provider.send(payload, resolvedMessage);

  if (!sendResult.ok) {
    await ledger.upsert({
      idempotencyKey: payload.idempotencyKey,
      emailType: "transactional",
      resultId: payload.resultId,
      userId,
      provider: provider.name,
      status: "failed",
      lastErrorCode: sendResult.safeErrorCode,
    });
    if (trackAnalytics) {
      await trackResultEmailAnalytics("failed", payload, {
        userId,
        provider: provider.name,
        failureStage: "provider_send",
        safeErrorCode: sendResult.safeErrorCode,
      });
    }
    return {
      status: "failed",
      idempotencyKey: payload.idempotencyKey,
      provider: provider.name,
      safeErrorCode: sendResult.safeErrorCode,
    };
  }

  await ledger.upsert({
    idempotencyKey: payload.idempotencyKey,
    emailType: "transactional",
    resultId: payload.resultId,
    userId,
    provider: provider.name,
    status: "sent",
    providerMessageId: sendResult.providerMessageId,
  });

  if (trackAnalytics) {
    await trackResultEmailAnalytics("sent", payload, {
      userId,
      provider: provider.name,
    });
  }

  return {
    status: "sent",
    idempotencyKey: payload.idempotencyKey,
    provider: provider.name,
    providerMessageId: sendResult.providerMessageId,
  };
}

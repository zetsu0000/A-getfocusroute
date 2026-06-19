import { getResultEmailTemplateVersion } from "@/lib/email/config";
import { buildResultEmailIdempotencyKey } from "@/lib/email/result-email-idempotency";
import { buildResultEmailUrls } from "@/lib/email/result-email-urls";
import type { ResultEmailBuildInput, ResultEmailPayload } from "@/lib/email/types";
import { normalizeRecipientEmail } from "@/lib/email/validation";
import { normalizeQuizAnswers, resolveResultScoreDataFromQuizRow } from "@/lib/result-score-data";
import { getSignatureFromAnswers } from "@/lib/signature";

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readResultId(row: Record<string, unknown>): string | null {
  const id = stringField(row.id);
  return id || null;
}

function readStoredPattern(row: Record<string, unknown>): {
  patternKey: string;
  patternName: string;
} | null {
  const patternKey = stringField(row.signature_key);
  const patternName = stringField(row.signature_name);
  if (!patternKey || !patternName) return null;
  return { patternKey, patternName };
}

/**
 * Builds the canonical transactional result-email payload from a persisted quiz row.
 * Does not include raw answers or payment data.
 */
export function buildResultEmailPayload(
  input: ResultEmailBuildInput,
): ResultEmailPayload {
  const resultId = readResultId(input.quizRow);
  if (!resultId) {
    throw new Error("result_email_missing_result_id");
  }

  const recipientEmail = normalizeRecipientEmail(input.recipientEmail);
  if (!recipientEmail) {
    throw new Error("result_email_invalid_recipient");
  }

  const rowEmail = normalizeRecipientEmail(stringField(input.quizRow.email));
  if (rowEmail && rowEmail !== recipientEmail) {
    throw new Error("result_email_recipient_mismatch");
  }

  const answers = normalizeQuizAnswers(input.quizRow.answers);
  const storedPattern = readStoredPattern(input.quizRow);
  const signature =
    storedPattern ??
    (() => {
      const computed = getSignatureFromAnswers(answers);
      return {
        patternKey: computed.signature,
        patternName: computed.title,
      };
    })();

  const scoreData = resolveResultScoreDataFromQuizRow(input.quizRow);
  const { resultUrl, dashboardUrl } = buildResultEmailUrls(input.siteOrigin);
  const templateVersion = input.templateVersion ?? getResultEmailTemplateVersion();

  return {
    resultId,
    recipientEmail,
    recipientName: input.recipientName?.trim() || stringField(input.quizRow.name) || null,
    patternKey: signature.patternKey,
    patternName: signature.patternName,
    focusFrictionScore: scoreData
      ? {
          value: scoreData.value,
          minimum: 0,
          maximum: 100,
        }
      : null,
    resultUrl,
    dashboardUrl,
    locale: input.locale?.trim() || "en-US",
    emailType: "transactional",
    idempotencyKey: buildResultEmailIdempotencyKey(resultId, templateVersion),
  };
}

/** Ensures payload stays free of raw answers and other forbidden fields. */
export function assertResultEmailPayloadSafe(payload: ResultEmailPayload): void {
  const serialized = JSON.stringify(payload);
  const forbidden = ["selectedOptions", "answers", "client_secret", "payment_method"];
  for (const token of forbidden) {
    if (serialized.includes(token)) {
      throw new Error("result_email_unsafe_payload");
    }
  }
}

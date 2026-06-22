import { getResultEmailTemplateVersion } from "@/lib/email/config";
import { buildResultEmailIdempotencyKey } from "@/lib/email/result-email-idempotency";
import { buildResultEmailUrls } from "@/lib/email/result-email-urls";
import type { ResultEmailBuildInput, ResultEmailPayloadBuildResult } from "@/lib/email/types";
import { normalizeRecipientEmail } from "@/lib/email/validation";
import { normalizeQuizAnswers, resolveResultScoreDataFromQuizRow } from "@/lib/result-score-data";
import {
  getSignatureFromAnswers,
  hasUsableSignatureSignal,
  normalizeSignatureAnswers,
} from "@/lib/signature";

const DEMOGRAPHIC_ONLY_QUESTION_IDS = new Set(["age", "name"]);

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
 * Pattern fields always come from getSignatureFromAnswers — never client-supplied storage.
 */
export function buildResultEmailPayload(
  input: ResultEmailBuildInput,
): ResultEmailPayloadBuildResult {
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
  const signatureAnswers = normalizeSignatureAnswers(answers);
  const hasDemographicOnly =
    answers.length > 0 &&
    answers.every((row) => DEMOGRAPHIC_ONLY_QUESTION_IDS.has(row.questionId));

  if (hasDemographicOnly || !hasUsableSignatureSignal(answers)) {
    throw new Error("result_email_insufficient_answers");
  }

  const signature = getSignatureFromAnswers(signatureAnswers);
  const storedPattern = readStoredPattern(input.quizRow);
  const patternMismatch = storedPattern
    ? storedPattern.patternKey !== signature.signature ||
      storedPattern.patternName !== signature.title
    : false;

  const scoreData = resolveResultScoreDataFromQuizRow(input.quizRow);
  const { resultUrl, dashboardUrl, planUrl } = buildResultEmailUrls();
  const templateVersion = input.templateVersion ?? getResultEmailTemplateVersion();

  return {
    patternMismatch,
    payload: {
      resultId,
      recipientEmail,
      recipientName: input.recipientName?.trim() || stringField(input.quizRow.name) || null,
      patternKey: signature.signature,
      patternName: signature.title,
      focusFrictionScore: scoreData
        ? {
            value: scoreData.value,
            minimum: 0,
            maximum: 100,
          }
        : null,
      resultUrl,
      dashboardUrl,
      planUrl,
      locale: input.locale?.trim() || "en-US",
      emailType: "transactional",
      idempotencyKey: buildResultEmailIdempotencyKey(resultId, templateVersion),
    },
  };
}

/** Ensures payload stays free of raw answers and other forbidden fields. */
export function assertResultEmailPayloadSafe(
  payload: ResultEmailPayloadBuildResult["payload"],
): void {
  const serialized = JSON.stringify(payload);
  const forbidden = ["selectedOptions", "answers", "client_secret", "payment_method"];
  for (const token of forbidden) {
    if (serialized.includes(token)) {
      throw new Error("result_email_unsafe_payload");
    }
  }
}

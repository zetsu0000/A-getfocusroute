import type { ResultEmailMessage, ResultEmailPayload } from "@/lib/email/types";

export type { ResultEmailMessage };

export type ProviderSendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; safeErrorCode: string };

export interface ResultEmailProvider {
  readonly name: string;
  send(payload: ResultEmailPayload, message: ResultEmailMessage): Promise<ProviderSendResult>;
}

/** DEV/TEST PLACEHOLDER ONLY — PR 7B supplies production copy. */
export function buildPlaceholderResultEmailMessage(
  payload: ResultEmailPayload,
): ResultEmailMessage {
  const scoreLine = payload.focusFrictionScore
    ? `Score available: ${payload.focusFrictionScore.value}`
    : "Score unavailable";
  return {
    subject: "[DEV PLACEHOLDER] Your FocusRoute result",
    previewText: "[DEV PLACEHOLDER] Access your saved FocusRoute result.",
    textBody: [
      "[DEV PLACEHOLDER — NOT PRODUCTION COPY]",
      "Your FocusRoute result is ready.",
      `Pattern: ${payload.patternName}`,
      scoreLine,
      `View result: ${payload.resultUrl}`,
    ].join("\n"),
    htmlBody: "<p>[DEV PLACEHOLDER — NOT PRODUCTION COPY]</p>",
  };
}

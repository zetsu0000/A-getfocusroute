import type { ResultEmailMessage, ResultEmailPayload } from "@/lib/email/types";

export type ProviderSendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; safeErrorCode: string };

export interface ResultEmailProvider {
  readonly name: string;
  send(payload: ResultEmailPayload, message: ResultEmailMessage): Promise<ProviderSendResult>;
}

export function buildPlaceholderResultEmailMessage(
  payload: ResultEmailPayload,
): ResultEmailMessage {
  const scoreLine = payload.focusFrictionScore
    ? `Score available: ${payload.focusFrictionScore.value}`
    : "Score unavailable";
  return {
    subject: "Your FocusRoute result",
    previewText: "Access your saved FocusRoute result.",
    textBody: [
      "Your FocusRoute result is ready.",
      `Pattern: ${payload.patternName}`,
      scoreLine,
      `View result: ${payload.resultUrl}`,
    ].join("\n"),
    htmlBody: `<p>Your FocusRoute result is ready.</p>`,
  };
}

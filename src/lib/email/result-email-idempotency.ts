import { getResultEmailTemplateVersion } from "@/lib/email/config";

export function buildResultEmailIdempotencyKey(
  resultId: string,
  templateVersion = getResultEmailTemplateVersion(),
): string {
  const safeResultId = resultId.trim();
  const safeVersion = templateVersion.trim() || "1";
  return `result_email:${safeResultId}:${safeVersion}`;
}

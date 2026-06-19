import { getResultEmailSiteOrigin } from "@/lib/email/config";
import { isSafeAbsoluteUrl } from "@/lib/email/validation";

export type ResultEmailUrls = {
  resultUrl: string;
  dashboardUrl: string;
};

/**
 * Authenticated dashboard routes only — no signed tokens or query-string PII.
 * Users access their saved result after signing in with the same email.
 */
export function buildResultEmailUrls(siteOrigin = getResultEmailSiteOrigin()): ResultEmailUrls {
  const origin = siteOrigin.replace(/\/+$/, "");
  const resultUrl = `${origin}/dashboard/profile`;
  const dashboardUrl = `${origin}/dashboard`;
  if (!isSafeAbsoluteUrl(resultUrl) || !isSafeAbsoluteUrl(dashboardUrl)) {
    throw new Error("result_email_unsafe_url");
  }
  return { resultUrl, dashboardUrl };
}

import { getResultEmailSiteOrigin } from "@/lib/email/config";
import { isSafeAbsoluteUrl } from "@/lib/email/validation";

export type ResultEmailUrls = {
  resultUrl: string;
  dashboardUrl: string;
  planUrl: string;
};

/**
 * Static, server-derived routes only — no signed tokens or query-string PII.
 * `planUrl` is the public assessment funnel so a guest can return to their
 * checkout/plan without logging in; `resultUrl`/`dashboardUrl` are the
 * authenticated areas. Origin comes from server configuration only.
 */
export function buildResultEmailUrls(): ResultEmailUrls {
  const origin = getResultEmailSiteOrigin().replace(/\/+$/, "");
  const resultUrl = `${origin}/dashboard/profile`;
  const dashboardUrl = `${origin}/dashboard`;
  const planUrl = `${origin}/assessment`;
  if (
    !isSafeAbsoluteUrl(resultUrl) ||
    !isSafeAbsoluteUrl(dashboardUrl) ||
    !isSafeAbsoluteUrl(planUrl)
  ) {
    throw new Error("result_email_unsafe_url");
  }
  return { resultUrl, dashboardUrl, planUrl };
}

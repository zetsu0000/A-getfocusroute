import "server-only";

const DEFAULT_SITE_ORIGIN = "https://getfocusroute.com";
const DEFAULT_TEMPLATE_VERSION = "1";

/** Disabled unless explicitly set to the string "true". */
export function isResultEmailSendingEnabled(): boolean {
  return process.env.RESULT_EMAIL_SENDING_ENABLED === "true";
}

export function getResultEmailTemplateVersion(): string {
  const raw = process.env.RESULT_EMAIL_TEMPLATE_VERSION?.trim();
  return raw && /^\d+$/.test(raw) ? raw : DEFAULT_TEMPLATE_VERSION;
}

/** Server-only origin for links — never derived from client input. */
export function getResultEmailSiteOrigin(): string {
  const configured =
    process.env.RESULT_EMAIL_SITE_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_ORIGIN;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return DEFAULT_SITE_ORIGIN;
    }
    return url.origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export function getConfiguredEmailProviderName(): string | null {
  const raw = process.env.RESULT_EMAIL_PROVIDER?.trim().toLowerCase();
  return raw || null;
}

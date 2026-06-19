import "server-only";

const DEFAULT_SITE_ORIGIN = "https://getfocusroute.com";
const DEFAULT_TEMPLATE_VERSION = "1";

const APPROVED_PRODUCTION_HOSTS = new Set([
  "getfocusroute.com",
  "www.getfocusroute.com",
]);

/** Disabled unless explicitly set to the string "true". */
export function isResultEmailSendingEnabled(): boolean {
  return process.env.RESULT_EMAIL_SENDING_ENABLED === "true";
}

export function getResultEmailTemplateVersion(): string {
  const raw = process.env.RESULT_EMAIL_TEMPLATE_VERSION?.trim();
  return raw && /^\d+$/.test(raw) ? raw : DEFAULT_TEMPLATE_VERSION;
}

function parseConfiguredOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.username || url.password) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (url.search || url.hash) return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Server-only origin for links — never derived from request payloads. */
export function getResultEmailSiteOrigin(): string {
  const configured =
    parseConfiguredOrigin(process.env.RESULT_EMAIL_SITE_ORIGIN?.trim()) ??
    parseConfiguredOrigin(process.env.NEXT_PUBLIC_SITE_URL?.trim());

  const origin = configured ?? DEFAULT_SITE_ORIGIN;

  if (process.env.NODE_ENV === "production") {
    if (isLocalhostOrigin(origin)) {
      return DEFAULT_SITE_ORIGIN;
    }
    const host = new URL(origin).hostname.toLowerCase();
    if (!APPROVED_PRODUCTION_HOSTS.has(host)) {
      return DEFAULT_SITE_ORIGIN;
    }
    return `https://${host}`;
  }

  return origin;
}

export function getConfiguredEmailProviderName(): string | null {
  const raw = process.env.RESULT_EMAIL_PROVIDER?.trim().toLowerCase();
  return raw || null;
}

/** Mock delivery is allowed only outside production. */
export function isMockProviderAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (getConfiguredEmailProviderName() !== "mock") return false;
  return process.env.RESULT_EMAIL_ALLOW_MOCK !== "false";
}

export function isRealEmailProviderName(name: string): boolean {
  return name !== "mock" && name !== "noop";
}

export type ProductionEmailConfigValidation =
  | { ok: true }
  | { ok: false; safeErrorCode: string };

export function validateProductionEmailConfiguration(): ProductionEmailConfigValidation {
  if (
    process.env.NODE_ENV === "production" &&
    getConfiguredEmailProviderName() === "mock"
  ) {
    return { ok: false, safeErrorCode: "mock_provider_forbidden_in_production" };
  }
  return { ok: true };
}

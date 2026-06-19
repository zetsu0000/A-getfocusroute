const EMAIL_MAX_LENGTH = 320;
const LOCAL_PART_MAX = 64;
const DOMAIN_MAX = 255;

function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function isValidLocalPart(local: string): boolean {
  if (!local || local.length > LOCAL_PART_MAX) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (local.includes("..")) return false;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local);
}

function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > DOMAIN_MAX) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (domain.includes("..")) return false;
  if (!domain.includes(".")) return false;
  return /^[a-z0-9.-]+$/i.test(domain);
}

/** Conservative server-side recipient validation — prefer safe rejection. */
export function normalizeRecipientEmail(email: string): string | null {
  if (typeof email !== "string") return null;
  if (email !== email.trim()) return null;
  if (hasControlCharacters(email)) return null;
  if (/\s/.test(email)) return null;

  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > EMAIL_MAX_LENGTH) return null;

  const parts = normalized.split("@");
  if (parts.length !== 2) return null;

  const [local, domain] = parts;
  if (!isValidLocalPart(local) || !isValidDomain(domain)) return null;
  return normalized;
}

export function isSafeAbsoluteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.search || parsed.hash) return false;
    const joined = parsed.pathname.toLowerCase();
    if (joined.includes("@")) return false;
    return true;
  } catch {
    return false;
  }
}

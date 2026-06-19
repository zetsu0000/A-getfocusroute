const EMAIL_MAX_LENGTH = 320;

/** Normalizes and validates a recipient address for server-side delivery. */
export function normalizeRecipientEmail(email: string): string | null {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > EMAIL_MAX_LENGTH) return null;
  const at = normalized.indexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;
  const domain = normalized.slice(at + 1);
  if (!domain.includes(".")) return null;
  return normalized;
}

export function isSafeAbsoluteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.username || parsed.password) return false;
    const joined = `${parsed.pathname}${parsed.search}${parsed.hash}`.toLowerCase();
    if (joined.includes("@")) return false;
    const forbiddenKeys = ["email", "token", "secret", "answers", "quiz"];
    for (const key of forbiddenKeys) {
      if (parsed.searchParams.has(key)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

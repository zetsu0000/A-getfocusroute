const STORAGE_KEY = "focusroute_result_email_token";

/**
 * Guest result-email proof token issued by POST /api/quiz-result.
 * Persisted in sessionStorage so a mid-funnel refresh can still authorize the
 * one-time result-email send at the paywall/checkout. Not used for paid access.
 */
export function getPersistedResultEmailToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setPersistedResultEmailToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearPersistedResultEmailToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

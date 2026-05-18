const STORAGE_KEY = "focusroute_quiz_result_server_id";

/**
 * Server-issued quiz row id (UUID), persisted in sessionStorage for mid-funnel refresh only.
 * Not used for paid access.
 */
export function getPersistedQuizResultId(): string | null {
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

export function setPersistedQuizResultId(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearPersistedQuizResultId(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

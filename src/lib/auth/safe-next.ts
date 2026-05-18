const DEFAULT_NEXT = "/dashboard";

/** Same-origin path only — prevents open redirects via `next`. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_NEXT;
  if (!raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_NEXT;
  if (raw.includes("\\") || raw.includes("://")) return DEFAULT_NEXT;
  return raw.length > 2048 ? DEFAULT_NEXT : raw;
}

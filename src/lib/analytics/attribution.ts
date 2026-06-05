"use client";

/**
 * First-party UTM / click-id attribution layer.
 *
 * Captures marketing parameters from the landing URL and persists both a
 * first-touch snapshot (written once, never overwritten) and a latest-touch
 * snapshot (refreshed whenever a new campaign lands). Storage is localStorage
 * with a first-party cookie mirror of the latest touch so server-side checkout
 * creation can read it if ever needed.
 *
 * Only non-PII campaign metadata is stored here. Email, phone, name, CPF and
 * address are never captured. This module is SSR-safe: every storage access is
 * guarded and the pure parsing helpers work without `window` (used by tests).
 *
 * Note: `src/lib/analytics/client.ts` keeps its own narrow UTM read for the Meta
 * Pixel context (utm_* + fbclid latest-touch). This module is the richer,
 * superset store consumed by GTM / GA4 / dataLayer and is additive — it does not
 * change what is sent to Meta.
 */

export const ATTRIBUTION_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
  "msclkid",
] as const;

export type AttributionParamKey = (typeof ATTRIBUTION_PARAM_KEYS)[number];
export type AttributionParams = Partial<Record<AttributionParamKey, string>>;
export type AttributionTouch = AttributionParams & {
  captured_at?: string;
  landing_path?: string;
};
export type Attribution = {
  first: AttributionTouch | null;
  last: AttributionTouch | null;
};

const FIRST_TOUCH_KEY = "focusroute_attribution_first";
const LAST_TOUCH_KEY = "focusroute_attribution_last";
const COOKIE_KEY = "focusroute_attr";
const MAX_VALUE_LEN = 300;
const COOKIE_MAX_AGE_DAYS = 90;

// ── pure helpers (SSR-safe, unit-tested) ──────────────────────────────────────

export function extractAttributionParams(
  input: string | URLSearchParams,
): AttributionParams {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const out: AttributionParams = {};
  for (const key of ATTRIBUTION_PARAM_KEYS) {
    const raw = params.get(key);
    if (raw == null) continue;
    const value = raw.trim().slice(0, MAX_VALUE_LEN);
    if (value) out[key] = value;
  }
  return out;
}

export function hasAttributionParams(params: AttributionParams): boolean {
  return ATTRIBUTION_PARAM_KEYS.some((key) => Boolean(params[key]));
}

// ── storage plumbing ──────────────────────────────────────────────────────────

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readTouch(key: string): AttributionTouch | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttributionTouch;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeTouch(key: string, touch: AttributionTouch): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(touch));
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

function writeLastTouchCookie(touch: AttributionTouch): void {
  if (typeof document === "undefined") return;
  try {
    const value = encodeURIComponent(JSON.stringify(touch));
    document.cookie = `${COOKIE_KEY}=${value}; Max-Age=${COOKIE_MAX_AGE_DAYS * 86400}; Path=/; SameSite=Lax; Secure`;
  } catch {
    // Cookie write is best-effort.
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Reads the current URL, and if any tracking parameter is present, records it as
 * the latest touch (and as the first touch when none exists yet). Safe to call on
 * every route change — a no-op when the URL carries no campaign params.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") {
    return { first: null, last: null };
  }

  const params = extractAttributionParams(window.location.search);
  const first = readTouch(FIRST_TOUCH_KEY);
  const last = readTouch(LAST_TOUCH_KEY);

  if (!hasAttributionParams(params)) {
    return { first, last };
  }

  const touch: AttributionTouch = {
    ...params,
    captured_at: new Date().toISOString(),
    landing_path: window.location.pathname,
  };

  if (!first) {
    writeTouch(FIRST_TOUCH_KEY, touch);
  }
  writeTouch(LAST_TOUCH_KEY, touch);
  writeLastTouchCookie(touch);

  return {
    first: first ?? touch,
    last: touch,
  };
}

export function getFirstTouch(): AttributionTouch | null {
  return readTouch(FIRST_TOUCH_KEY);
}

export function getLastTouch(): AttributionTouch | null {
  return readTouch(LAST_TOUCH_KEY);
}

export function getAttribution(): Attribution {
  return { first: getFirstTouch(), last: getLastTouch() };
}

/**
 * Flat, non-PII attribution snapshot suitable for attaching to analytics events
 * or a checkout request. Latest-touch campaign fields plus the first-touch
 * source/medium for multi-touch context.
 */
export function getAttributionForAnalytics(): Record<string, string> {
  const last = getLastTouch();
  const first = getFirstTouch();
  const out: Record<string, string> = {};
  if (last) {
    for (const key of ATTRIBUTION_PARAM_KEYS) {
      const value = last[key];
      if (value) out[key] = value;
    }
  }
  if (first?.utm_source) out.first_touch_source = first.utm_source;
  if (first?.utm_medium) out.first_touch_medium = first.utm_medium;
  if (first?.utm_campaign) out.first_touch_campaign = first.utm_campaign;
  return out;
}

"use client";

/**
 * Centralized marketing-consent gate for the browser analytics surfaces added
 * alongside Meta Pixel: Google Tag Manager, GA4 (via GTM), Microsoft Clarity and
 * any `window.dataLayer` push.
 *
 * Meta Pixel keeps its own internal `canTrackMarketing()` in
 * `src/lib/metaPixel.ts` and is intentionally left untouched. This helper exists
 * so the *new* stack has a single, auditable place to wire consent.
 *
 * There is no consent banner in the project yet. When one is added, read its
 * marketing opt-in here — every surface that imports `canTrackMarketing()` will
 * respect it without any further changes.
 */
export function canTrackMarketing(): boolean {
  if (typeof window === "undefined") return false;
  // Default-on until a consent manager is introduced. Mirror the conservative
  // behaviour of Meta Pixel so the two stacks stay consistent.
  return true;
}

"use client";

/**
 * Central `window.dataLayer` helper for Google Tag Manager (and GA4 configured
 * through GTM).
 *
 * Design notes:
 * - This is the *only* place the app writes to `dataLayer`. GTM consumes these
 *   custom events; GA4 page_view is handled by GTM's History Change trigger, so
 *   nothing here pushes page_view (avoids duplicate GA4 page views on App Router
 *   navigations).
 * - These pushes are independent of Meta Pixel. Meta events still fire via `fbq`
 *   in `src/lib/metaPixel.ts` — pushing to dataLayer does not duplicate them.
 * - Every push is consent-gated via `canTrackMarketing()` and PII-stripped as a
 *   defense-in-depth measure: email / phone / name / CPF / address never reach
 *   GTM, GA4 or any downstream tag.
 */

import { getAttributionForAnalytics } from "@/lib/analytics/attribution";
import { canTrackMarketing } from "@/lib/analytics/consent";
import {
  FIRST_PARTY_EVENTS,
  type FirstPartyEventName,
} from "@/lib/analytics/events";

export type DataLayerValue =
  | string
  | number
  | boolean
  | null
  | DataLayerValue[];
export type DataLayerParams = Record<string, DataLayerValue>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Measurement events this app emits to the dataLayer. */
export const DATA_LAYER_EVENTS = {
  startAssessment: "start_assessment",
  quizStarted: "quiz_started",
  quizStepCompleted: "quiz_step_completed",
  emailSubmitted: "email_submitted",
  quizCompleted: "quiz_completed",
  paywallViewed: "paywall_viewed",
  checkoutStarted: "checkout_started",
  stripeCheckoutOpened: "stripe_checkout_opened",
} as const;

export type DataLayerEventName =
  (typeof DATA_LAYER_EVENTS)[keyof typeof DATA_LAYER_EVENTS];

const PII_KEYS = new Set([
  "email",
  "e_mail",
  "phone",
  "telephone",
  "telefone",
  "cpf",
  "name",
  "nome",
  "first_name",
  "last_name",
  "full_name",
  "address",
  "endereco",
  "zip",
  "cep",
]);

/** Drops any key that looks like personal data. Exported for testing. */
export function sanitizeDataLayerParams(
  params: Record<string, unknown> = {},
): DataLayerParams {
  const out: DataLayerParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (PII_KEYS.has(key.toLowerCase())) continue;
    if (value === undefined) continue;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
      continue;
    }
    if (
      Array.isArray(value) &&
      value.every(
        (item) =>
          item === null ||
          ["string", "number", "boolean"].includes(typeof item),
      )
    ) {
      out[key] = value as DataLayerValue[];
    }
  }
  return out;
}

export function ensureDataLayer(): Record<string, unknown>[] | null {
  if (typeof window === "undefined") return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** Pushes a clean, consent-gated custom event to the dataLayer for GTM. */
export function pushDataLayerEvent(
  eventName: string,
  params: Record<string, unknown> = {},
): void {
  if (!canTrackMarketing()) return;
  const dataLayer = ensureDataLayer();
  if (!dataLayer) return;
  try {
    dataLayer.push({ event: eventName, ...sanitizeDataLayerParams(params) });
  } catch {
    // Analytics must never break the app.
  }
}

function withAttribution(
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  let attribution: Record<string, string> = {};
  try {
    attribution = getAttributionForAnalytics();
  } catch {
    attribution = {};
  }
  return { ...attribution, ...params };
}

// ── named convenience events (the public API) ─────────────────────────────────

export function trackStartAssessment(params?: Record<string, unknown>): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.startAssessment, withAttribution(params));
}

export function trackQuizStarted(params?: Record<string, unknown>): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.quizStarted, withAttribution(params));
}

export function trackQuizStepCompleted(
  step: number | string,
  params?: Record<string, unknown>,
): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.quizStepCompleted, {
    step,
    ...(params ?? {}),
  });
}

export function trackEmailSubmitted(params?: Record<string, unknown>): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.emailSubmitted, withAttribution(params));
}

export function trackQuizCompleted(params?: Record<string, unknown>): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.quizCompleted, withAttribution(params));
}

export function trackPaywallViewed(params?: Record<string, unknown>): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.paywallViewed, withAttribution(params));
}

export function trackCheckoutStarted(params?: Record<string, unknown>): void {
  pushDataLayerEvent(DATA_LAYER_EVENTS.checkoutStarted, withAttribution(params));
}

export function trackStripeCheckoutOpened(
  params?: Record<string, unknown>,
): void {
  pushDataLayerEvent(
    DATA_LAYER_EVENTS.stripeCheckoutOpened,
    withAttribution(params),
  );
}

// ── bridge: existing first-party funnel events → dataLayer ─────────────────────
//
// The funnel already fires first-party events (assessment_started,
// email_submitted, …) from the quiz / checkout components. Rather than editing
// those protected components, `trackEvent` in client.ts bridges the relevant
// ones here, so GTM receives the full funnel from a single integration point.
// Page-view style events have no mapping and are intentionally skipped to avoid
// duplicating GA4 page_view.

const DATA_LAYER_EVENT_BY_FIRST_PARTY: Partial<
  Record<FirstPartyEventName, DataLayerEventName>
> = {
  [FIRST_PARTY_EVENTS.assessmentStarted]: DATA_LAYER_EVENTS.startAssessment,
  [FIRST_PARTY_EVENTS.emailSubmitted]: DATA_LAYER_EVENTS.emailSubmitted,
  [FIRST_PARTY_EVENTS.quizCompleted]: DATA_LAYER_EVENTS.quizCompleted,
  [FIRST_PARTY_EVENTS.paywallViewed]: DATA_LAYER_EVENTS.paywallViewed,
  [FIRST_PARTY_EVENTS.paymentIntentCreated]: DATA_LAYER_EVENTS.checkoutStarted,
  [FIRST_PARTY_EVENTS.paymentElementLoaded]:
    DATA_LAYER_EVENTS.stripeCheckoutOpened,
};

export function dataLayerEventForFirstParty(
  eventName: FirstPartyEventName,
): DataLayerEventName | null {
  return DATA_LAYER_EVENT_BY_FIRST_PARTY[eventName] ?? null;
}

/** Mirrors a first-party funnel event into the dataLayer when one maps. */
export function bridgeFirstPartyEvent(
  eventName: FirstPartyEventName,
  params: Record<string, unknown> = {},
): void {
  const mapped = dataLayerEventForFirstParty(eventName);
  if (!mapped) return;
  pushDataLayerEvent(mapped, withAttribution(params));
}

/**
 * Server-side plan → Stripe Price ID registry (V2 — 3-plan model).
 *
 * SECURITY: The browser never sends Price IDs, amounts, or currencies. It sends
 * only a `plan_key` ("plan_1week" | "plan_4week" | "plan_12week"); this module
 * resolves that key to the intro + renewal Price IDs from server-only env vars.
 * Stripe charges whatever is configured on the resolved Price IDs.
 *
 * Each plan maps to two recurring prices provisioned in Stripe:
 *   - INTRO   — recurring price whose interval == the intro window
 *               (week×1 / week×4 / week×12), billed once (schedule iterations: 1)
 *   - RENEWAL — the standard recurring price ($43.50/month or $89.99/3-months)
 *
 * The env vars (STRIPE_PRICE_PLAN_*) are NOT prefixed NEXT_PUBLIC_, so they are
 * absent from the client bundle. Reading them here mirrors the proven pattern in
 * `src/lib/stripe/productKeyPolicy.ts` (no leak: undefined client-side).
 */

import type { ProductKey } from "@/lib/access/products";
import { PLAN_KEYS, type PlanKey } from "@/lib/billing/plans";

export type PlanPriceIds = {
  introPriceId: string;
  renewalPriceId: string;
};

/** Each plan maps 1:1 to a membership product key (all grant membership). */
const PLAN_TO_PRODUCT_KEY: Record<PlanKey, ProductKey> = {
  plan_1week: "membership_1week",
  plan_4week: "membership_4week",
  plan_12week: "membership_12week",
};

export function planKeyToProductKey(planKey: PlanKey): ProductKey {
  return PLAN_TO_PRODUCT_KEY[planKey];
}

function planPriceEnv(): Record<PlanKey, PlanPriceIds> {
  return {
    plan_1week: {
      introPriceId: process.env.STRIPE_PRICE_PLAN_1WEEK_INTRO ?? "",
      renewalPriceId: process.env.STRIPE_PRICE_PLAN_1WEEK_RENEWAL ?? "",
    },
    plan_4week: {
      introPriceId: process.env.STRIPE_PRICE_PLAN_4WEEK_INTRO ?? "",
      renewalPriceId: process.env.STRIPE_PRICE_PLAN_4WEEK_RENEWAL ?? "",
    },
    plan_12week: {
      introPriceId: process.env.STRIPE_PRICE_PLAN_12WEEK_INTRO ?? "",
      renewalPriceId: process.env.STRIPE_PRICE_PLAN_12WEEK_RENEWAL ?? "",
    },
  };
}

/**
 * Resolve a plan key to its intro + renewal Price IDs.
 * Returns null if either price is not configured for the environment.
 */
export function resolvePlanPrices(planKey: PlanKey): PlanPriceIds | null {
  const cfg = planPriceEnv()[planKey];
  if (!cfg || !cfg.introPriceId.trim() || !cfg.renewalPriceId.trim()) {
    return null;
  }
  return {
    introPriceId: cfg.introPriceId.trim(),
    renewalPriceId: cfg.renewalPriceId.trim(),
  };
}

/**
 * Reverse lookup: map any configured plan Price ID (intro OR renewal) back to
 * its plan key. Used by the webhook to resolve product_key from a subscription
 * item price during both the intro phase and the renewal phase.
 */
export function planKeyForPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  const needle = priceId.trim();
  if (!needle) return null;
  const env = planPriceEnv();
  for (const key of PLAN_KEYS) {
    const { introPriceId, renewalPriceId } = env[key];
    if (introPriceId.trim() === needle) return key;
    if (renewalPriceId.trim() === needle) return key;
  }
  return null;
}

/** Map any configured plan Price ID (intro OR renewal) to its product key. */
export function planProductKeyForPriceId(
  priceId: string | null | undefined,
): ProductKey | null {
  const planKey = planKeyForPriceId(priceId);
  return planKey ? planKeyToProductKey(planKey) : null;
}

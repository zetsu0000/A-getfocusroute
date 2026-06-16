import type Stripe from "stripe";

import type { ProductKey } from "@/lib/access/products";
import { planProductKeyForPriceId } from "@/lib/billing/planRegistry";

/**
 * Resolves any configured Stripe price ID to its product key.
 *
 * Resolution order (first match wins):
 *   1. STRIPE_PRICE_* server-only env vars  — preferred, not in browser bundle
 *   2. NEXT_PUBLIC_PRICE_* env vars         — fallback, same values in practice
 *
 * The two-layer lookup lets the webhook resolve product_key from price ID alone,
 * even when Stripe metadata is empty (e.g. after migrating to a new Stripe
 * account where product metadata has not yet been backfilled).
 */
export function resolvePriceIdToProductKey(priceId: string): ProductKey | null {
  if (!priceId) return null;

  const entries: Array<[string | undefined, ProductKey]> = [
    // Server-only (preferred — not exposed to client bundle)
    [process.env.STRIPE_PRICE_BRAIN_PROFILE,       "brain_profile"],
    [process.env.STRIPE_PRICE_ROADMAP_28_DAY,      "roadmap_28_day"],
    [process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY,  "membership_monthly"],
    [process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL,   "membership_annual"],
    // NEXT_PUBLIC (fallback — same price IDs, different env-var scope)
    [process.env.NEXT_PUBLIC_PRICE_ASSESSMENT,     "brain_profile"],
    [process.env.NEXT_PUBLIC_PRICE_ROADMAP,        "roadmap_28_day"],
    [process.env.NEXT_PUBLIC_PRICE_MONTHLY,        "membership_monthly"],
    [process.env.NEXT_PUBLIC_PRICE_ANNUAL,         "membership_annual"],
  ];

  const needle = priceId.trim();
  for (const [envId, key] of entries) {
    if (envId && envId.trim() === needle) return key;
  }

  // V2 3-plan model: resolve both the intro and renewal Price IDs of each plan
  // (plan_1week / plan_4week / plan_12week) to their membership product key.
  return planProductKeyForPriceId(needle);
}

/**
 * Resolves a price ID + funnel step to a one-time product key.
 * funnelStep is accepted for backward compatibility but resolution
 * now relies on price ID env-var mapping instead of step matching.
 */
export function resolveOneTimeProductKey(
  priceId: string,
  funnelStep: string,
): ProductKey | null {
  void funnelStep; // kept for API compatibility; resolution uses price ID only
  const key = resolvePriceIdToProductKey(priceId);
  if (key === "brain_profile" || key === "roadmap_28_day") return key;
  return null;
}

const MEMBERSHIP_PRODUCT_KEYS: readonly ProductKey[] = [
  "membership_monthly",
  "membership_annual",
  "membership_1week",
  "membership_4week",
  "membership_12week",
];

export function resolveMembershipProductKey(priceId: string): ProductKey | null {
  const key = resolvePriceIdToProductKey(priceId);
  if (key && MEMBERSHIP_PRODUCT_KEYS.includes(key)) return key;
  return null;
}

/**
 * Validates that the product_key declared in PaymentIntent metadata matches
 * what the server derives from the embedded priceId.
 * Returns true (allow) when validation cannot be performed.
 */
export function paymentIntentProductKeyMatchesPolicy(
  meta: Record<string, string | undefined>,
  declaredProductKey: ProductKey,
): boolean {
  const priceId = meta.priceId?.trim();
  const funnel  = meta.funnel_step?.trim();
  if (!priceId || !funnel) return true;
  const expected = resolveOneTimeProductKey(priceId, funnel);
  if (expected === null) return false;
  return expected === declaredProductKey;
}

export function firstSubscriptionItemPriceId(
  sub: Stripe.Subscription,
): string | null {
  const item = sub.items?.data?.[0];
  if (!item?.price) return null;
  const p = item.price;
  return typeof p === "string" ? p : p.id;
}

export function subscriptionProductKeyMatchesPolicy(
  sub: Stripe.Subscription,
  declaredProductKey: ProductKey,
): boolean {
  const priceId = firstSubscriptionItemPriceId(sub);
  if (!priceId) return true;
  const expected = resolveMembershipProductKey(priceId);
  if (expected === null) return false;
  return expected === declaredProductKey;
}
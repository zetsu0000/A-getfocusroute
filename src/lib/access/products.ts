/**
 * Purchasable product identifiers (Stripe / checkout).
 * Maps to entitlement rows via PRODUCT_TO_ENTITLEMENTS.
 */

export const PRODUCT_KEYS = [
  "brain_profile",
  "roadmap_28_day",
  "membership_monthly",
  "membership_annual",
  // V2 3-plan subscription model (intro → renewal). All grant membership.
  "membership_1week",
  "membership_4week",
  "membership_12week",
] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export const SUBSCRIPTION_PRODUCT_KEYS = [
  "membership_monthly",
  "membership_annual",
  "membership_1week",
  "membership_4week",
  "membership_12week",
] as const satisfies readonly ProductKey[];

/** Feature-branch name — canonical export. */
export const PRODUCT_TO_ENTITLEMENTS = {
  brain_profile:      ["brain_profile", "bonus_explain_script"],
  roadmap_28_day:     ["roadmap_28_day", "bonus_toolkit", "bonus_audio"],
  membership_monthly: ["membership", "retake_quiz", "billing_portal"],
  membership_annual:  ["membership", "retake_quiz", "billing_portal"],
  // V2 subscription-first model: a plan subscription is the funnel's primary
  // paywall, so it unlocks the ENTIRE product — full Brain Profile, 28-Day
  // Protocol, and bonuses — plus the membership-only capabilities. These ride
  // the same subscription grant/expiry lifecycle as the membership entitlements,
  // so access tracks the subscription's period (ends when the subscription does).
  membership_1week:   ["membership", "retake_quiz", "billing_portal", "brain_profile", "bonus_explain_script", "roadmap_28_day", "bonus_toolkit", "bonus_audio"],
  membership_4week:   ["membership", "retake_quiz", "billing_portal", "brain_profile", "bonus_explain_script", "roadmap_28_day", "bonus_toolkit", "bonus_audio"],
  membership_12week:  ["membership", "retake_quiz", "billing_portal", "brain_profile", "bonus_explain_script", "roadmap_28_day", "bonus_toolkit", "bonus_audio"],
} as const satisfies Record<ProductKey, readonly string[]>;

/** main-branch alias for backward compatibility. */
export const PRODUCT_ENTITLEMENTS = PRODUCT_TO_ENTITLEMENTS;

export type EntitlementKey = (typeof PRODUCT_TO_ENTITLEMENTS)[ProductKey][number];


export function isProductKey(value: string): value is ProductKey {
  return (PRODUCT_KEYS as readonly string[]).includes(value);
}

export function assertProductKey(value: unknown): ProductKey {
  if (typeof value === "string" && isProductKey(value)) return value;
  throw new Error(`Invalid product_key: ${String(value)}`);
}

export function getEntitlementsForProduct(productKey: ProductKey) {
  return PRODUCT_TO_ENTITLEMENTS[productKey];
}

export function isSubscriptionProduct(productKey: ProductKey) {
  return (SUBSCRIPTION_PRODUCT_KEYS as readonly string[]).includes(productKey);
}

/**
 * Maps price ID env vars to their product key. Used as a fallback when metadata
 * is absent. For the V2 3-plan products the *renewal* price is the representative
 * value here; both intro and renewal IDs resolve via
 * `planProductKeyForPriceId` in `productKeyPolicy.resolvePriceIdToProductKey`.
 */
function priceEnvMap(): Record<ProductKey, string | undefined> {
  return {
    brain_profile:
      process.env.STRIPE_PRICE_BRAIN_PROFILE ??
      process.env.NEXT_PUBLIC_PRICE_ASSESSMENT,
    roadmap_28_day:
      process.env.STRIPE_PRICE_ROADMAP_28_DAY ??
      process.env.NEXT_PUBLIC_PRICE_ROADMAP,
    membership_monthly:
      process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY ??
      process.env.NEXT_PUBLIC_PRICE_MONTHLY,
    membership_annual:
      process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL ??
      process.env.NEXT_PUBLIC_PRICE_ANNUAL,
    membership_1week:  process.env.STRIPE_PRICE_PLAN_1WEEK_RENEWAL,
    membership_4week:  process.env.STRIPE_PRICE_PLAN_4WEEK_RENEWAL,
    membership_12week: process.env.STRIPE_PRICE_PLAN_12WEEK_RENEWAL,
  };
}

export function productKeyForPriceId(priceId?: string | null): ProductKey | null {
  if (!priceId) return null;
  const entries = Object.entries(priceEnvMap()) as [ProductKey, string | undefined][];
  return entries.find(([, id]) => id === priceId)?.[0] ?? null;
}
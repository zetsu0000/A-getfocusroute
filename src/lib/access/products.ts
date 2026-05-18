/**
 * Purchasable product identifiers (Stripe / checkout). Map to entitlement rows via PRODUCT_TO_ENTITLEMENTS.
 */

export const PRODUCT_KEYS = [
  "brain_profile",
  "roadmap_28_day",
  "membership_monthly",
  "membership_annual",
] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export const PRODUCT_TO_ENTITLEMENTS = {
  brain_profile: ["brain_profile", "bonus_explain_script"],
  roadmap_28_day: ["roadmap_28_day", "bonus_toolkit", "bonus_audio"],
  membership_monthly: ["membership", "retake_quiz", "billing_portal"],
  membership_annual: ["membership", "retake_quiz", "billing_portal"],
} as const satisfies Record<ProductKey, readonly string[]>;

export function isProductKey(value: string): value is ProductKey {
  return (PRODUCT_KEYS as readonly string[]).includes(value);
}

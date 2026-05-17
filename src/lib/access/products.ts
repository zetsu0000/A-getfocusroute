export const PRODUCT_KEYS = [
  "brain_profile",
  "roadmap_28_day",
  "membership_monthly",
  "membership_annual",
] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export const PRODUCT_ENTITLEMENTS: Record<ProductKey, readonly string[]> = {
  brain_profile: ["brain_profile", "bonus_explain_script"],
  roadmap_28_day: ["roadmap_28_day", "bonus_toolkit", "bonus_audio"],
  membership_monthly: ["membership", "retake_quiz", "billing_portal"],
  membership_annual: ["membership", "retake_quiz", "billing_portal"],
} as const;

export const SUBSCRIPTION_PRODUCT_KEYS = [
  "membership_monthly",
  "membership_annual",
] as const satisfies readonly ProductKey[];

export type EntitlementKey = (typeof PRODUCT_ENTITLEMENTS)[ProductKey][number];

const PRODUCT_KEYS_SET = new Set<string>(PRODUCT_KEYS);

export function isProductKey(value: unknown): value is ProductKey {
  return typeof value === "string" && PRODUCT_KEYS_SET.has(value);
}

export function assertProductKey(value: unknown): ProductKey {
  if (isProductKey(value)) return value;
  throw new Error(`Invalid product_key: ${String(value)}`);
}

export function getEntitlementsForProduct(productKey: ProductKey) {
  return PRODUCT_ENTITLEMENTS[productKey];
}

export function isSubscriptionProduct(productKey: ProductKey) {
  return SUBSCRIPTION_PRODUCT_KEYS.includes(productKey as (typeof SUBSCRIPTION_PRODUCT_KEYS)[number]);
}

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
  };
}

export function productKeyForPriceId(priceId?: string | null): ProductKey | null {
  if (!priceId) return null;

  const entries = Object.entries(priceEnvMap()) as [ProductKey, string | undefined][];
  return entries.find(([, configuredPriceId]) => configuredPriceId === priceId)?.[0] ?? null;
}

export function resolveProductKey(input: {
  productKey?: unknown;
  product_key?: unknown;
  priceId?: string | null;
  price_id?: string | null;
}): ProductKey {
  const candidate = input.productKey ?? input.product_key;
  if (candidate) return assertProductKey(candidate);

  const priceId = input.priceId ?? input.price_id;
  const productKey = productKeyForPriceId(priceId);
  if (productKey) return productKey;

  throw new Error("Missing product_key or recognized priceId.");
}

export function compactStripeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
      .map(([key, value]) => [key, String(value)])
  );
}

import type { ProductKey } from "@/lib/access/products";
import { isProductKey } from "@/lib/access/products";

/** Stripe metadata keys (values are strings; max 500 chars each). */
export const STRIPE_META = {
  product_key: "product_key",
  email: "email",
  funnel_step: "funnel_step",
  quiz_result_id: "quiz_result_id",
  user_name: "user_name",
} as const;

export type StripeFunnelMetadata = {
  product_key: ProductKey;
  email: string;
  funnel_step: string;
  quiz_result_id: string;
  user_name: string;
};

export function buildStripeFunnelMetadata(input: {
  product_key: ProductKey;
  email: string;
  funnel_step: string;
  quiz_result_id?: string | null;
  user_name?: string | null;
}): Record<string, string> {
  return {
    [STRIPE_META.product_key]: input.product_key,
    [STRIPE_META.email]: input.email.trim().toLowerCase(),
    [STRIPE_META.funnel_step]: input.funnel_step,
    [STRIPE_META.quiz_result_id]: (input.quiz_result_id ?? "").trim(),
    [STRIPE_META.user_name]: (input.user_name ?? "").trim(),
  };
}

/** Stripe object metadata is string-valued. */
export type StripeObjectMetadata = Record<string, string> | null | undefined;

export function parseProductKeyFromMetadata(
  meta: StripeObjectMetadata,
): ProductKey | null {
  const raw = meta?.[STRIPE_META.product_key];
  if (!raw || typeof raw !== "string") return null;
  return isProductKey(raw) ? raw : null;
}

export function parseEmailFromMetadata(
  meta: StripeObjectMetadata,
): string | null {
  const raw = meta?.[STRIPE_META.email];
  if (!raw || typeof raw !== "string" || !raw.includes("@")) return null;
  return raw.trim().toLowerCase();
}

export function parseFunnelMetadata(
  meta: StripeObjectMetadata,
): Omit<StripeFunnelMetadata, "product_key" | "email"> & {
  product_key: ProductKey | null;
  email: string | null;
} {
  return {
    product_key: parseProductKeyFromMetadata(meta),
    email: parseEmailFromMetadata(meta),
    funnel_step:
      typeof meta?.[STRIPE_META.funnel_step] === "string"
        ? meta[STRIPE_META.funnel_step]
        : "",
    quiz_result_id:
      typeof meta?.[STRIPE_META.quiz_result_id] === "string"
        ? meta[STRIPE_META.quiz_result_id]
        : "",
    user_name:
      typeof meta?.[STRIPE_META.user_name] === "string"
        ? meta[STRIPE_META.user_name]
        : "",
  };
}

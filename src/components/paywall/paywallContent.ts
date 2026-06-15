/**
 * Single source of truth for paywall copy.
 *
 * The paywall previously repeated price, deliverables, refund, diagnosis and
 * access messaging across several sections. Centralizing the copy here keeps
 * each message defined once and makes the hierarchy unit-testable without a DOM.
 * Every claim below is verified against the implementation / policies:
 *   - one-time payment  → a single PaymentIntent (no subscription)
 *   - 7-day refund      → refund-policy "This Is Me" 7-Day Guarantee
 *   - instant access    → plan unlocks in the account on success
 *   - not a diagnosis   → /disclaimer
 */

import { PAYWALL_DELIVERABLES } from "@/lib/paid-value";

/** The id the top CTA scrolls to and the checkout-reached observer watches. */
export const PAYWALL_CHECKOUT_ID = "paywall-checkout";

/** The id the top CTA scrolls to so customer proof stays visible before fields. */
export const PAYWALL_TRUST_CHECKOUT_ID = "paywall-trust-checkout";

/**
 * The three paywall deliverables, expressed as customer outcomes. Sourced from
 * the centralized paid-value module so the result preview and the paywall stay
 * in sync. Each translates a real shipped Brain Profile section (radar +
 * strengths/friction, focus conditions + initiation/recovery guidance, and the
 * Explain-It-To-Someone Script granted via the bonus_explain_script
 * entitlement). No invented deliverables; exactly three.
 */
export function paywallDeliverables(): string[] {
  return [...PAYWALL_DELIVERABLES];
}

/**
 * One quiet trust line shown once, near the primary CTA. Deliberately a single
 * middot-joined sentence — not three separate icon badges — so the offer reads
 * calm and editorial rather than chip-heavy.
 */
export const TRUST_LINE = "One-time payment \u00B7 Instant access \u00B7 7-day refund";

/** The non-diagnosis boundary, stated once near the offer. */
export const NON_DIAGNOSIS_LINE =
  "Educational self-understanding, not a medical diagnosis.";

/** The single secure-payment signal, shown next to the actual checkout. */
export const SECURE_PAYMENT_LINE = "Secure payment processed by Stripe";

/**
 * The final payment CTA label, built as one complete string from the
 * centralized price value so the spacing around the price can never break
 * (previously two JSX fragments rendered as "Pay $27& Unlock My Plan").
 */
export function payCtaLabel(price: string): string {
  return `Pay ${price} \u2014 Unlock My Profile`;
}

/**
 * One short, truthful post-payment expectation. Deliberately does NOT promise
 * an emailed copy or lifetime access — only what the entitlement flow delivers:
 * the plan unlocks in the account and is reachable with the same email.
 */
export const POST_PAYMENT_EXPECTATION =
  "After payment, your full plan unlocks in your account — sign in any time with the same email.";

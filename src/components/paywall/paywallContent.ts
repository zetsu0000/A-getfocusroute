import { BRAIN_OS } from "@/lib/positioning";

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

/** The id the top CTA scrolls to and the checkout-reached observer watches. */
export const PAYWALL_CHECKOUT_ID = "paywall-checkout";

/**
 * The three concrete deliverables in plain words — what the user learns, the
 * practical first step, and where the plan stays available. Derived from the
 * user's plan focus; no invented deliverables.
 */
export function paywallDeliverables(planFocus: string): string[] {
  return [
    `Your full pattern breakdown — and a plan for ${planFocus}`,
    "Your first next step, small enough to try today",
    "Instant access in your account, kept there for you",
  ];
}

/** Scannable trust line shown once, near the primary CTA. */
export const TRUST_LINE_ITEMS = [
  "One-time payment",
  "Instant account access",
  "7-day refund",
] as const;

/** The non-diagnosis boundary, stated once near the offer. */
export const NON_DIAGNOSIS_LINE =
  "Educational self-understanding, not a medical diagnosis.";

/** The single secure-payment signal, shown next to the actual checkout. */
export const SECURE_PAYMENT_LINE = "Secure payment processed by Stripe";

/**
 * One short, truthful post-payment expectation. Deliberately does NOT promise
 * an emailed copy or lifetime access — only what the entitlement flow delivers:
 * the plan unlocks in the account and is reachable with the same email.
 */
export const POST_PAYMENT_EXPECTATION =
  "After payment, your full plan unlocks in your account — sign in any time with the same email.";

/**
 * Exactly three FAQ items: the objections not already answered by the offer,
 * deliverables, or trust line. No promises about how fast results appear.
 */
export const PAYWALL_FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "What exactly do I get?",
    a: "Your full focus-pattern breakdown, your Executive Function Radar, and your first next step — all saved in your account the moment you pay.",
  },
  {
    q: "What happens after payment?",
    a: "Your plan unlocks immediately in your account. Sign in any time with the same email to pick up where you left off.",
  },
  {
    q: "What if it doesn't fit me?",
    a: `${BRAIN_OS.guaranteeTitle}: if it doesn't feel like you, email support@getfocusroute.com within 7 days for a full refund — no questions.`,
  },
] as const;

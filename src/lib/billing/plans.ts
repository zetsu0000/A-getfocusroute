/**
 * Client-safe FocusRoute membership plan catalogue (V2 — 3-plan model).
 *
 * This module holds ONLY display metadata: plan names, the amounts shown in the
 * UI, the intro/renewal cadence, the per-day calculation, and the "popular"
 * badge. It deliberately contains NO Stripe Price IDs — those live server-only
 * in `planRegistry.ts` and are resolved from the `plan_key` the browser sends.
 *
 * Source of truth for charges is always Stripe: the server resolves the
 * Price ID for a given `plan_key` and Stripe charges whatever is on that price.
 * Keep these display amounts in sync with the prices you provision in Stripe.
 *
 * Pricing (intro window → standard renewal):
 *   - 1-Week:  $10.50 for 7 days   → $43.50 / month
 *   - 4-Week:  $19.99 for 28 days  → $43.50 / month   (default · Most Popular)
 *   - 12-Week: $34.99 for 84 days  → $89.99 / quarter
 */

export const PLAN_KEYS = ["plan_1week", "plan_4week", "plan_12week"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && (PLAN_KEYS as readonly string[]).includes(value);
}

/** Renewal cadence after the intro window. */
export type RenewalInterval = "month" | "quarter";

export type PlanDisplay = {
  key: PlanKey;
  /** Full label, e.g. "4-Week Plan". */
  name: string;
  /** Short label for summaries/badges, e.g. "4-Week". */
  shortName: string;
  /** One-line value proposition shown under the title. */
  blurb: string;
  /** Intro charge in cents (what the customer pays today). */
  introAmount: number;
  /** Intro window length in days (also the first billing cycle). */
  introDays: number;
  /** Standard recurring charge in cents after the intro window. */
  renewalAmount: number;
  /** Recurring cadence after the intro window. */
  renewalInterval: RenewalInterval;
  /** Default-selected, "Most Popular" plan. */
  popular: boolean;
  currency: "usd";
};

export const PLANS: Record<PlanKey, PlanDisplay> = {
  plan_1week: {
    key: "plan_1week",
    name: "1-Week Plan",
    shortName: "1-Week",
    blurb: "Try the full system for a week.",
    introAmount: 1050,
    introDays: 7,
    renewalAmount: 4350,
    renewalInterval: "month",
    popular: false,
    currency: "usd",
  },
  plan_4week: {
    key: "plan_4week",
    name: "4-Week Plan",
    shortName: "4-Week",
    blurb: "Enough runway to build the habit.",
    introAmount: 1999,
    introDays: 28,
    renewalAmount: 4350,
    renewalInterval: "month",
    popular: true,
    currency: "usd",
  },
  plan_12week: {
    key: "plan_12week",
    name: "12-Week Plan",
    shortName: "12-Week",
    blurb: "The full transformation window — best value.",
    introAmount: 3499,
    introDays: 84,
    renewalAmount: 8999,
    renewalInterval: "quarter",
    popular: false,
    currency: "usd",
  },
};

/** Display order in the selector (1-Week, 4-Week, 12-Week). */
export const PLAN_LIST: readonly PlanDisplay[] = [
  PLANS.plan_1week,
  PLANS.plan_4week,
  PLANS.plan_12week,
];

/** Default-selected plan (the "Most Popular" 4-Week). */
export const DEFAULT_PLAN_KEY: PlanKey = "plan_4week";

/**
 * Per-day price during the intro window, in cents, rounded to the nearest cent.
 *   1-Week:  1050 / 7  = 150  → $1.50/day
 *   4-Week:  1999 / 28 = 71   → $0.71/day
 *   12-Week: 3499 / 84 = 42   → $0.42/day
 */
export function introPerDayCents(plan: PlanDisplay): number {
  return Math.round(plan.introAmount / plan.introDays);
}

/** "$10.50", "$43.50", "$0.42" — always two decimals (every amount has cents). */
export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Short renewal cadence suffix, e.g. "/mo" or "/3 mo". */
export function renewalSuffix(plan: PlanDisplay): string {
  return plan.renewalInterval === "month" ? "/mo" : "/3 mo";
}

/** Human renewal cadence, e.g. "month" or "3 months". */
export function renewalCadenceLabel(plan: PlanDisplay): string {
  return plan.renewalInterval === "month" ? "month" : "3 months";
}

/** Intro window phrased for disclosure copy, e.g. "7 days", "4 weeks", "12 weeks". */
export function introWindowLabel(plan: PlanDisplay): string {
  if (plan.introDays % 7 === 0 && plan.introDays > 7) {
    return `${plan.introDays / 7} weeks`;
  }
  return `${plan.introDays} days`;
}

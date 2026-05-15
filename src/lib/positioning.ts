/**
 * FocusRoute Brain OS™ messaging — aligned with internal positioning doc.
 * Stripe still charges whatever amount is on each Price ID; keep UI amounts in sync
 * with the dashboard (or override via NEXT_PUBLIC_UI_* env vars).
 */

function usd(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

const paywall = Number(process.env.NEXT_PUBLIC_UI_PAYWALL_USD ?? 97);
const paywallAnchor = Number(process.env.NEXT_PUBLIC_UI_PAYWALL_ANCHOR_USD ?? 1357);
const upsell = Number(process.env.NEXT_PUBLIC_UI_UPSELL_USD ?? 197);
const upsellAnchor = Number(process.env.NEXT_PUBLIC_UI_UPSELL_ANCHOR_USD ?? 297);
const membershipMonthly = Number(process.env.NEXT_PUBLIC_UI_MEMBERSHIP_MONTHLY_USD ?? 27);
const membershipAnnual = Number(process.env.NEXT_PUBLIC_UI_MEMBERSHIP_ANNUAL_USD ?? 197);

export const BRAIN_OS = {
  /** Product line */
  line: "FocusRoute Brain OS",
  lineTm: "FocusRoute Brain OS™",

  assessment: "Cognitive Mapping Assessment™",
  brainProfile: "Brain Profile™",
  radar: "Executive Function Radar™",
  signature: "ADHD Signature™",
  protocol: "28-Day Protocol™",
  mechanismTagline: "Profile-to-Protocol™ — we map your brain first, then build your plan.",

  /** Hero — Headline 01 + supporting line from positioning doc */
  heroTitleBefore: "You're not lazy.",
  heroTitleAccent: "Your brain just needs a different operating system.",
  heroSub:
    "Discover your Brain Profile in about 12 minutes — then unlock your personalized 28-Day Protocol™ built for how your mind actually works.",

  headerEyebrow: "BRAIN OS",

  /** Badge on landing */
  landingBadge: "FREE START · COGNITIVE MAPPING · ~12 MIN",

  /** Guarantee — paywall / legal adjacent copy */
  guaranteeTitle: 'The "This Is Me" 7-Day Guarantee',
  guaranteeBody:
    "Read your Brain Profile™. If it doesn't feel like the most accurate description of how your brain works — email us within 7 days for a full refund. No forms. No questions.",

  /** Clinical contrast (marketing framing — not a medical claim) */
  clinicalContrastShort: "Often $600+ and months on a waitlist for clinical intake.",

  /** Pricing labels shown in UI (must match Stripe Price amounts) */
  price: {
    paywallValue: paywall,
    paywallAnchorValue: paywallAnchor,
    paywall: usd(paywall),
    paywallAnchor: usd(paywallAnchor),
    upsellValue: upsell,
    upsellAnchorValue: upsellAnchor,
    upsell: usd(upsell),
    upsellAnchor: usd(upsellAnchor),
    membershipMonthlyValue: membershipMonthly,
    membershipAnnualValue: membershipAnnual,
    membershipMonthly: usd(membershipMonthly),
    membershipAnnual: usd(membershipAnnual),
  },

  /** Value stack line items (paywall “what you unlock”) — condensed from doc */
  paywallUnlockBullets: [
    `Full ${"Brain Profile™"} — narrative + ${"Executive Function Radar™"} + ${"ADHD Signature™"}`,
    `"Finally, An Explanation" plain-English letter`,
    `${"28-Day Protocol™"} — daily micro-actions calibrated to your profile`,
    "Toolkit bundle + executive-function playsheets",
    "Science-grounded strategies — not generic planner advice",
  ],
} as const;

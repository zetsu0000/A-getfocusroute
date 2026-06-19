/**
 * Public-safe customer evidence registry.
 *
 * This module is imported by Client Components, so every field below ships to
 * the browser. Keep it limited to public display and analytics-safe data:
 * no source filesystem paths, consent notes, verifier names, email addresses,
 * private approval records, quiz answers, or medical information.
 */

export type SocialProofCategory =
  | "clarity"
  | "usability"
  | "practical_value"
  | "product_trust"
  | "customer_support"
  | "post_purchase_reassurance";

export type SocialProofPlacement =
  | "result_transition"
  | "paywall_post_checkout";

export interface ApprovedTestimonial {
  /** Stable, opaque id used for React keys and safe analytics metadata. */
  id: string;
  /**
   * Short approved excerpt — shown on the result screen and in the collapsed
   * paywall proof, where a single scannable line is enough.
   */
  shortQuote: string;
  /**
   * The complete authorized public review — shown only when the paywall proof
   * is expanded. This is the customer's real, full text (faithful to the
   * authorized source, never invented or padded); when a customer wrote only a
   * single sentence, that sentence is the complete story.
   */
  fullQuote: string;
  /** Approved public attribution. */
  attribution: string;
  /** Repo-relative public image path. Never a local filesystem path. */
  image: string;
  /** Primary objection this proof resolves. */
  category: SocialProofCategory;
  /** Public placements this proof is suitable for. */
  eligiblePlacement: readonly SocialProofPlacement[];
  /** Hard gate. False never renders publicly. */
  approved: boolean;
}
export interface SocialProofJourney {
  result: ApprovedTestimonial[];
  paywall: ApprovedTestimonial[];
}

export const SOCIAL_PROOF_POOL_VERSION = "2026-06-18-v3";

const RESULT: SocialProofPlacement = "result_transition";
const PAYWALL: SocialProofPlacement = "paywall_post_checkout";

export const APPROVED_TESTIMONIALS: readonly ApprovedTestimonial[] = [
  {
    id: "proof-001",
    shortQuote:
      "Not cheap, but at least you are getting a lot actually, so it is a good deal.",
    fullQuote:
      "Not cheap, but at least you are getting a lot actually, so it is a good deal. Something one might gift a friend if there was an option (for example, gifting a 3-month membership).",
    attribution: "Mark H.",
    image: "/testimonials/mark-hendrik.png",
    category: "practical_value",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-002",
    shortQuote: "Very easy interface, everything is clear and cool.",
    fullQuote:
      "I am very satisfied. Very easy interface, everything is clear and cool.",
    attribution: "Daria M.",
    image: "/testimonials/daria-mart.png",
    category: "clarity",
    eligiblePlacement: [RESULT],
    approved: true,
  },
  {
    id: "proof-003",
    shortQuote:
      "They showed a great disposition to help. Thumbs up to their support.",
    fullQuote:
      "I contacted the technical support and, before getting their answer, I had already fixed the problem myself. Although, in their favor, it only took a few hours to get their answer, and they showed a great disposition to help. So, thumbs up to their support.",
    attribution: "Alan T.",
    image: "/testimonials/alan-thompson.png",
    category: "customer_support",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-004",
    shortQuote:
      "The support team responded very quickly with a clear and accurate answer. They helped me understand the situation right away and resolved my concern.",
    fullQuote:
      "I had a question regarding an issue with my account, and the support team responded very quickly with a clear and accurate answer. They helped me understand the situation right away and resolved my concern. Excellent customer service and a great support experience. Thank you!",
    attribution: "Melissa R.",
    image: "/testimonials/melissa-roberts.png",
    category: "customer_support",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-005",
    shortQuote:
      "Super professional, helpful, and went above and beyond. He took the time to explain things.",
    fullQuote:
      "I was surprised how fast and quick Dean from the FocusRoute team was. He was super professional, helpful, and went above and beyond. He took the time to explain things. I already loved FocusRoute and now I love them even more. I look forward to making many more cool things with them.",
    attribution: "Barbara S.",
    image: "/testimonials/barbara-sanchez.png",
    category: "customer_support",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-006",
    shortQuote:
      "They were ultra persistent in getting to the bottom of this. They were honestly trying to help me through the entire situation.",
    fullQuote:
      "To Jason, Aria, and the whole FocusRoute support team. I can't thank them enough for not slamming the door on me. They were ultra persistent in getting to the bottom of this. I truly appreciate it. Very professional and not one email was demeaning. They all were honestly trying to help me through this entire situation. Thank you once again for being decent and in order, and operating with a spirit of excellence!",
    attribution: "Pamela D.",
    image: "/testimonials/pamela-davis.png",
    category: "customer_support",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-007",
    shortQuote: "Everything is amazing.",
    fullQuote: "Everything is amazing.",
    attribution: "Gregory H.",
    image: "/testimonials/gregory-hernandez.png",
    category: "product_trust",
    eligiblePlacement: [],
    approved: true,
  },
  {
    id: "proof-008",
    shortQuote:
      "I am very happy with FocusRoute so far. It has greatly helped me come up with new and creative ideas.",
    fullQuote:
      "I am very happy with FocusRoute so far. It has greatly helped me come up with new and creative ideas; it has greatly improved how much value my focus has. Each time I had a problem, the support team has done everything they could to give me help and to fix my problem! It has been an overall good experience!",
    attribution: "Amy R.",
    image: "/testimonials/amy-reyes.png",
    // The strongest product-experience review in the pool — it talks about
    // actually using FocusRoute and getting value, not support handling. It is
    // dedicated to the checkout (paywall) as the lead proof so the buyer sees a
    // product-value story exactly where the purchase decision is made.
    category: "product_trust",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-009",
    shortQuote:
      "He was incredibly empathetic, listened to my situation, and guided me on exactly what verification documents were needed.",
    fullQuote:
      "I recently went through a nightmare situation where my primary email was completely hacked, meaning I lost access to my FocusRoute account and my active subscription. I was incredibly stressed. I reached out on their Email channel hoping for a miracle, and a team member named Theo responded. He was incredibly empathetic, listened to my situation, and guided me on exactly what verification documents were needed. After I provided my proof, Theo went above and beyond to make a one-time exception and manually transferred my entire account and subscription to my new, secure email address. The whole process was handled so quickly and professionally. Losing your digital identity to a hacker is terrifying, but Theo and the FocusRoute team made the recovery process absolutely seamless. This is what top-tier customer service looks like. Highly recommend them not just for their tech, but for actually caring about their users!",
    attribution: "Larry B.",
    image: "/testimonials/larry-bennett.png",
    category: "post_purchase_reassurance",
    eligiblePlacement: [PAYWALL],
    approved: true,
  },
  {
    id: "proof-010",
    shortQuote: "It really is helping me re-define myself.",
    fullQuote: "It really is helping me re-define myself.",
    attribution: "Benjamin L.",
    image: "/testimonials/benjamin-lee.png",
    category: "post_purchase_reassurance",
    eligiblePlacement: [RESULT, PAYWALL],
    approved: true,
  },
  {
    id: "proof-011",
    shortQuote:
      "It's brilliant. Quite easy to navigate around, and it doesn't break the bank.",
    fullQuote:
      "It's brilliant. Quite easy to navigate around, and it doesn't break the bank.",
    attribution: "Billy W.",
    image: "/testimonials/billy-wilson.png",
    category: "usability",
    eligiblePlacement: [RESULT, PAYWALL],
    approved: true,
  },
  {
    id: "proof-012",
    shortQuote: "Tools that solve our problems.",
    fullQuote: "Tools that solve our problems.",
    attribution: "Jean B.",
    image: "/testimonials/jean-brooks.png",
    category: "practical_value",
    eligiblePlacement: [],
    approved: true,
  },
];

const RESULT_SLOT_CATEGORY_PREFERENCES: readonly (readonly SocialProofCategory[])[] =
  [
    ["clarity", "usability", "practical_value", "product_trust"],
    ["usability", "clarity", "practical_value", "product_trust"],
    ["practical_value", "product_trust", "clarity", "usability"],
  ];

const PAYWALL_SLOT_CATEGORY_PREFERENCES: readonly (readonly SocialProofCategory[])[] =
  [
    // The always-visible (collapsed) checkout proof leads with product
    // experience, so the buyer first reads how the product is actually used and
    // valued — not a support anecdote. The remaining slots keep the support /
    // reassurance proofs that previously carried this section.
    [
      "product_trust",
      "customer_support",
      "post_purchase_reassurance",
      "practical_value",
    ],
    [
      "customer_support",
      "product_trust",
      "post_purchase_reassurance",
      "practical_value",
    ],
    [
      "post_purchase_reassurance",
      "practical_value",
      "customer_support",
      "product_trust",
    ],
  ];

/**
 * Ops kill-switch. Set NEXT_PUBLIC_SOCIAL_PROOF_OFF=1 to force-hide customer
 * proof without shipping placeholder or fabricated evidence.
 */
function featureDisabled(): boolean {
  return process.env.NEXT_PUBLIC_SOCIAL_PROOF_OFF === "1";
}

export function liveTestimonials(
  testimonials: readonly ApprovedTestimonial[] = APPROVED_TESTIMONIALS,
): ApprovedTestimonial[] {
  if (featureDisabled()) return [];
  return testimonials.filter((testimonial) => testimonial.approved);
}

export function hasApprovedTestimonials(): boolean {
  return liveTestimonials().length > 0;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function bySeedRank(
  testimonials: readonly ApprovedTestimonial[],
  seed: string,
  slotKey: string,
): ApprovedTestimonial[] {
  return [...testimonials].sort((a, b) => {
    const aRank = hashString(`${seed}:${slotKey}:${a.id}`);
    const bRank = hashString(`${seed}:${slotKey}:${b.id}`);
    if (aRank !== bRank) return aRank - bRank;
    return a.id.localeCompare(b.id);
  });
}

function pickForSlot({
  testimonials,
  placement,
  usedIds,
  categoryPreferences,
  seed,
  slotKey,
}: {
  testimonials: readonly ApprovedTestimonial[];
  placement: SocialProofPlacement;
  usedIds: Set<string>;
  categoryPreferences: readonly SocialProofCategory[];
  seed: string;
  slotKey: string;
}): ApprovedTestimonial | null {
  const eligible = testimonials.filter(
    (testimonial) =>
      testimonial.approved &&
      !usedIds.has(testimonial.id) &&
      testimonial.eligiblePlacement.includes(placement),
  );

  for (const category of categoryPreferences) {
    const categoryMatches = eligible.filter(
      (testimonial) => testimonial.category === category,
    );
    const picked = bySeedRank(categoryMatches, seed, `${slotKey}:${category}`)[0];
    if (picked) return picked;
  }

  return bySeedRank(eligible, seed, `${slotKey}:fallback`)[0] ?? null;
}

/**
 * Pure deterministic selector. It returns up to six unique approved records,
 * prioritizing the right objection categories for each placement while
 * gracefully falling back when a category is short.
 */
export function selectSocialProofJourney(
  testimonials: readonly ApprovedTestimonial[],
  seed: string,
): SocialProofJourney {
  const live = liveTestimonials(testimonials);
  const usedIds = new Set<string>();
  const result: ApprovedTestimonial[] = [];
  const paywall: ApprovedTestimonial[] = [];

  for (let i = 0; i < RESULT_SLOT_CATEGORY_PREFERENCES.length; i += 1) {
    const picked = pickForSlot({
      testimonials: live,
      placement: RESULT,
      usedIds,
      categoryPreferences: RESULT_SLOT_CATEGORY_PREFERENCES[i],
      seed,
      slotKey: `result:${i}`,
    });
    if (picked) {
      result.push(picked);
      usedIds.add(picked.id);
    }
  }

  for (let i = 0; i < PAYWALL_SLOT_CATEGORY_PREFERENCES.length; i += 1) {
    const picked = pickForSlot({
      testimonials: live,
      placement: PAYWALL,
      usedIds,
      categoryPreferences: PAYWALL_SLOT_CATEGORY_PREFERENCES[i],
      seed,
      slotKey: `paywall:${i}`,
    });
    if (picked) {
      paywall.push(picked);
      usedIds.add(picked.id);
    }
  }

  return { result, paywall };
}

/**
 * Safe payload for social_proof_impression. It contains opaque ids and group
 * shape only, never quote text, attribution, image paths, source details, quiz
 * answers, or derived Cognitive Signature data.
 */
export function buildImpressionMetadata(
  testimonial: ApprovedTestimonial,
  placement: SocialProofPlacement,
  groupId: string,
  visibleCount: number,
): {
  placement: SocialProofPlacement;
  group_id: string;
  testimonial_id: string;
  visible_count: number;
} {
  return {
    placement,
    group_id: groupId,
    testimonial_id: testimonial.id,
    visible_count: visibleCount,
  };
}

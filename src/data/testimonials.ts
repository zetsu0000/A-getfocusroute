import type { BrainSignature } from "@/lib/signature";

/**
 * Approved customer-evidence registry for the result → paywall experience.
 *
 * ── INTEGRITY CONTRACT (read before editing) ───────────────────────────────
 * - Only REAL, customer-approved statements may be added here. Each entry needs
 *   written permission to publish, recorded in `approval`.
 * - Do NOT invent customers, names, photos, star ratings, counts, or
 *   "verified" labels. No AI-generated people. No fabricated metrics.
 * - An entry is shown publicly ONLY when `approved === true`. This array ships
 *   EMPTY on purpose: with no approved evidence, the funnel renders a verified
 *   trust signal (or nothing) instead of a testimonial — never placeholder or
 *   manufactured proof. The empty array IS the "disabled feature
 *   configuration"; adding an approved entry is the act of enabling the feature.
 * - Stories must describe subjective experience, planning, habits, clarity, and
 *   practical behavioral change only. No medical claims (no curing/treating/
 *   diagnosing ADHD, no "rewires your brain", no replacing medication).
 *
 * HOW TO ADD REAL EVIDENCE LATER:
 *   1. Get explicit written consent to publish the quote + attribution.
 *   2. Add an entry below with `approved: true` and a populated `approval` block.
 *   3. Tag it with the `signatures` it most resembles so users see the most
 *      similar experience (use "all" only for a genuinely signature-agnostic
 *      story).
 *   4. Keep the quote specific and behavioral; trim marketing language.
 */
export interface ApprovedTestimonial {
  /** Stable id — used for analytics (`testimonial_id`) and React keys. */
  id: string;
  /** The customer's own words. Specific and behavioral beats generic praise. */
  quote: string;
  /**
   * Attribution to render. Use only what the customer approved. Avoid
   * unverifiable "verified customer" wording unless verification truly exists.
   */
  attribution: string;
  /**
   * Cognitive Signatures this story is most relevant to, so the most similar
   * experience can be surfaced. `"all"` = safe for any signature.
   */
  signatures: BrainSignature[] | "all";
  /** Hard gate. `false` (the default for any draft) never renders publicly. */
  approved: boolean;
  /** Provenance for auditing. Never rendered to users. */
  approval?: {
    /** Internal reference to the stored written publish consent. */
    consentRef: string;
    /** ISO date the consent was recorded. */
    consentedAt: string;
    /** Who verified the consent + accuracy. */
    verifiedBy: string;
  };
}

/**
 * EMPTY BY DESIGN — no approved customer evidence exists yet.
 *
 * Template for a future real entry (replace every field with verified content
 * and only set `approved: true` with written consent on file):
 *
 *   {
 *     id: "story-sprinter-01",
 *     quote:
 *       "I'd rebuilt my whole productivity system three times this year. " +
 *       "This finally gave me one small step to start with instead of another overhaul.",
 *     attribution: "Customer with a Sprinter pattern",
 *     signatures: ["Sprinter"],
 *     approved: true,
 *     approval: {
 *       consentRef: "support-thread-1234",
 *       consentedAt: "2026-06-01",
 *       verifiedBy: "marcelo",
 *     },
 *   }
 */
export const APPROVED_TESTIMONIALS: ApprovedTestimonial[] = [];

/**
 * Ops kill-switch (defense in depth). Set `NEXT_PUBLIC_SOCIAL_PROOF_OFF=1` to
 * force-hide every testimonial even after approved evidence has been added.
 */
function featureDisabled(): boolean {
  return process.env.NEXT_PUBLIC_SOCIAL_PROOF_OFF === "1";
}

/** Approved + (kill-switch off) entries only. */
function liveTestimonials(): ApprovedTestimonial[] {
  if (featureDisabled()) return [];
  return APPROVED_TESTIMONIALS.filter((t) => t.approved);
}

/**
 * Most relevant approved testimonial for a signature, or `null`.
 *
 * Deterministic (no randomness → no hydration mismatch, no layout shift):
 * prefers a signature-specific match in declaration order, then a `"all"`
 * story, then `null`. Returning `null` is the graceful path — callers must show
 * a verified trust signal or nothing, never an empty container.
 */
export function getMatchedTestimonial(
  signature: BrainSignature,
): ApprovedTestimonial | null {
  const live = liveTestimonials();
  const specific = live.find(
    (t) => t.signatures !== "all" && t.signatures.includes(signature),
  );
  if (specific) return specific;
  return live.find((t) => t.signatures === "all") ?? null;
}

/** True only when at least one approved testimonial would render. */
export function hasApprovedTestimonials(): boolean {
  return liveTestimonials().length > 0;
}

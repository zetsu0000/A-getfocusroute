import type { BrainSignature } from "@/lib/signature";

/**
 * Approved customer-evidence registry for the result → paywall transition.
 *
 * ── INTEGRITY CONTRACT (read before editing) ───────────────────────────────
 * - Only REAL, customer-approved statements + photos may live here. Every entry
 *   in this file must have public-use authorization on file BEFORE it ships.
 * - Do NOT invent customers, names, photos, star ratings, counts, or
 *   "verified" labels. No stock or AI-generated people. No fabricated metrics.
 * - This module is imported by a Client Component, so everything here ships to
 *   the browser. Keep it to public-safe fields only — NEVER put private consent
 *   notes, source paths, verifier identities, or review comments in this file.
 *   Consent/authorization records are tracked outside the repo.
 * - `image` must be a repo-relative public path (e.g. "/testimonials/x.png").
 *   Never a local/absolute filesystem path.
 * - An entry shows publicly ONLY when `approved === true`. With nothing
 *   approved, the funnel shows no testimonial (just the truthful result→plan
 *   bridge) — never placeholder or manufactured proof.
 * - `signatures: "all"` until a customer's actual Cognitive Signature is
 *   verified AND authorized for that use. Do not imply "similar pattern"
 *   matching from evidence that does not establish the customer's result.
 * - Stories must stay subjective (clarity, usability, practical value, reduced
 *   friction, self-understanding). No medical/ADHD/treatment/clinical claims.
 */
export interface ApprovedTestimonial {
  /** Stable, opaque id — used for analytics + React keys. No customer name. */
  id: string;
  /** Approved public quote (verbatim, or shortened without changing meaning). */
  quote: string;
  /** Approved public attribution (kept conservative, e.g. first name + initial). */
  attribution: string;
  /** Repo-relative public image path, or undefined if no photo is approved. */
  image?: string;
  /**
   * Cognitive Signatures this story is approved to represent. `"all"` =
   * signature-agnostic (the only safe value until a customer's actual result
   * is verified and authorized for signature-specific matching).
   */
  signatures: BrainSignature[] | "all";
  /** Hard gate. `false` never renders publicly. */
  approved: boolean;
}

/**
 * Authorized customer evidence currently activated in the funnel.
 *
 * Kept to a single, compact, on-message story for the result→paywall decision
 * point (clarity / ease of use). Additional authorized customers + photos can
 * be added here later; the selector and component handle the rest. To add one:
 * place the approved photo in /public/testimonials, add an entry with
 * `approved: true`, and keep `signatures: "all"` unless the customer's actual
 * signature is verified and authorized.
 */
export const APPROVED_TESTIMONIALS: ApprovedTestimonial[] = [
  {
    id: "review-01",
    quote: "Very easy interface, everything is clear.",
    attribution: "Daria M.",
    image: "/testimonials/daria-mart.png",
    signatures: "all",
    approved: true,
  },
];

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
 * Deterministic: prefers a signature-specific match in declaration order, then
 * a `"all"` story, then `null`. Returning `null` is the graceful path — callers
 * must render nothing (no empty container), never fake proof.
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

export type SocialProofPlacement = "result_transition" | "paywall";

/** Whether a testimonial is a true signature-specific match for `signature`. */
export function isSignatureMatch(
  testimonial: ApprovedTestimonial,
  signature: BrainSignature,
): boolean {
  return (
    testimonial.signatures !== "all" &&
    testimonial.signatures.includes(signature)
  );
}

/**
 * Analytics payload for `social_proof_impression`. Pure + safe by construction:
 * only opaque ids/enums — never the quote, the attribution/name, or the image
 * path. Kept here (not in the component) so its safety is unit-testable.
 */
export function buildImpressionMetadata(
  testimonial: ApprovedTestimonial,
  placement: SocialProofPlacement,
  signature: BrainSignature,
): {
  placement: SocialProofPlacement;
  signature_key: BrainSignature;
  testimonial_id: string;
  match_type: "signature" | "generic";
} {
  return {
    placement,
    signature_key: signature,
    testimonial_id: testimonial.id,
    match_type: isSignatureMatch(testimonial, signature) ? "signature" : "generic",
  };
}

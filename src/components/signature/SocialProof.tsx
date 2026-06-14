"use client";

import { useEffect, useMemo, useRef } from "react";
import { BadgeCheck, Quote } from "lucide-react";
import type { BrainSignature } from "@/lib/signature";
import { getSignatureIdentity } from "@/lib/signature-identity";
import { getMatchedTestimonial } from "@/data/testimonials";
import { trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

type Placement = "result_transition" | "paywall";

interface SocialProofProps {
  /** The user's Cognitive Signature — used to surface the most similar story. */
  signature: BrainSignature;
  /** Where this instance lives, for analytics attribution. */
  placement: Placement;
  /**
   * What to show when no approved testimonial matches:
   * - "trust": a compact, substantiated trust signal (never a fake customer).
   * - "none":  render nothing — for screens that are already trust-dense, so the
   *            CTA/checkout is not pushed down by repeated reassurance.
   */
  fallback?: "trust" | "none";
}

/**
 * Social proof for the result → paywall transition.
 *
 * Renders an APPROVED, signature-matched customer story when one exists, and
 * fails gracefully otherwise: a verified trust signal or nothing — never
 * placeholder, invented, or "verified customer"-labelled content. The
 * `social_proof_impression` event fires once, only when a real testimonial
 * meaningfully enters the viewport (the trust fallback never counts as proof).
 */
export function SocialProof({
  signature,
  placement,
  fallback = "trust",
}: SocialProofProps) {
  const testimonial = useMemo(
    () => getMatchedTestimonial(signature),
    [signature],
  );
  const identity = getSignatureIdentity(signature);

  const firedRef = useRef(false);
  const nodeRef = useRef<HTMLElement | null>(null);

  const isSimilarPattern =
    !!testimonial &&
    testimonial.signatures !== "all" &&
    testimonial.signatures.includes(signature);

  useEffect(() => {
    if (!testimonial) return;
    const el = nodeRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || firedRef.current) return;
        firedRef.current = true;
        trackEvent(FIRST_PARTY_EVENTS.socialProofImpression, {
          meta: false,
          metadata: {
            placement,
            signature_key: signature,
            testimonial_id: testimonial.id,
            match_type: isSimilarPattern ? "signature" : "generic",
          },
        });
        io.disconnect();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [testimonial, placement, signature, isSimilarPattern]);

  if (testimonial) {
    return (
      <figure
        ref={nodeRef}
        className="v2-panel"
        style={{ margin: 0, padding: "16px 18px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 9,
          }}
        >
          <Quote size={13} color={identity.accent} aria-hidden="true" />
          <span className="v2-hud" style={{ fontSize: 9, color: identity.accent }}>
            {isSimilarPattern
              ? "From someone with a similar pattern"
              : "From a FocusRoute customer"}
          </span>
        </div>
        <blockquote
          style={{
            margin: 0,
            fontFamily: "var(--v2-font-display)",
            fontSize: 14.5,
            fontStyle: "italic",
            color: "var(--v2-ink-dim)",
            lineHeight: 1.65,
          }}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <figcaption className="v2-hud" style={{ fontSize: 9.5, marginTop: 9 }}>
          — {testimonial.attribution}
        </figcaption>
      </figure>
    );
  }

  if (fallback === "none") return null;

  /* Verified trust signal — not a testimonial. Every claim is substantiated in
     the repo: the plan is built from the user's own answers (signature.ts), and
     the 7-day refund is the documented "This Is Me" guarantee (refund-policy). */
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 14px",
        borderRadius: 12,
        border: `1px solid rgba(${identity.accentRgb},0.28)`,
        background: "rgba(148,163,255,0.05)",
      }}
    >
      <BadgeCheck
        size={16}
        color={identity.accent}
        strokeWidth={2.4}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />
      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          color: "var(--v2-ink-dim)",
          lineHeight: 1.5,
        }}
      >
        Built from your answers, not a generic routine — and backed by a 7-day
        refund.
      </p>
    </div>
  );
}

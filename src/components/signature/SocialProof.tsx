"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BrainSignature } from "@/lib/signature";
import {
  buildImpressionMetadata,
  getMatchedTestimonial,
  type SocialProofPlacement,
} from "@/data/testimonials";
import { trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

interface SocialProofProps {
  /** The user's Cognitive Signature — used to surface the most relevant story. */
  signature: BrainSignature;
  /** Where this instance lives, for analytics attribution. */
  placement: SocialProofPlacement;
}

/**
 * One compact, real, approved customer micro-proof for the result→paywall
 * decision point — a small photo + a short quote + conservative attribution.
 *
 * Renders nothing when no approved testimonial matches (the surrounding screen
 * supplies the truthful result→plan bridge); never an empty container, never
 * placeholder or "verified customer" content. `social_proof_impression` fires
 * once, only when this real testimonial meaningfully enters the viewport.
 */
export function SocialProof({ signature, placement }: SocialProofProps) {
  const testimonial = useMemo(
    () => getMatchedTestimonial(signature),
    [signature],
  );
  const [imageOk, setImageOk] = useState(true);

  const firedRef = useRef(false);
  const nodeRef = useRef<HTMLElement | null>(null);

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
          metadata: buildImpressionMetadata(testimonial, placement, signature),
        });
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [testimonial, placement, signature]);

  if (!testimonial) return null;

  const showPhoto = Boolean(testimonial.image) && imageOk;
  const initial = testimonial.attribution.trim().charAt(0).toUpperCase() || "•";

  return (
    <figure
      ref={nodeRef}
      style={{
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 14,
        border: "1px solid var(--v2-line)",
        background: "rgba(148,163,255,0.05)",
      }}
    >
      {/* Fixed-size avatar slot — reserves space whether the photo loads or
          falls back to an initial, so there is no layout shift. */}
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: "50%",
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(124,138,255,0.18)",
          border: "1px solid var(--v2-line)",
          color: "var(--v2-ink-dim)",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {showPhoto ? (
          // Small static asset; explicit dimensions prevent reflow. Decorative —
          // the name is in the caption — so alt is empty.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testimonial.image}
            alt=""
            width={38}
            height={38}
            loading="lazy"
            decoding="async"
            onError={() => setImageOk(false)}
            style={{ width: 38, height: 38, objectFit: "cover", display: "block" }}
          />
        ) : (
          initial
        )}
      </span>

      <div style={{ minWidth: 0 }}>
        <blockquote
          style={{
            margin: 0,
            fontFamily: "var(--v2-font-display)",
            fontSize: 13.5,
            fontStyle: "italic",
            color: "var(--v2-ink-dim)",
            lineHeight: 1.5,
          }}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <figcaption className="v2-hud" style={{ fontSize: 9.5, marginTop: 4 }}>
          — {testimonial.attribution}
        </figcaption>
      </div>
    </figure>
  );
}

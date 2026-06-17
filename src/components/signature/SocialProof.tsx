"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ChevronDown } from "lucide-react";
import {
  buildImpressionMetadata,
  type ApprovedTestimonial,
  type SocialProofJourney,
  type SocialProofPlacement,
} from "@/data/testimonials";
import { getOrCreateSocialProofJourney } from "@/lib/social-proof-session";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import { trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

const RESULT_GROUP_ID = "result_trust";
const PAYWALL_GROUP_ID = "paywall_trust";

/* Theme-adaptive surfaces. The component is identical in both worlds — same
   content, structure, spacing, behavior — only the surface/contrast change so
   the proof reads as a defined card on the daylight canvas, not a washed-out
   blue tint. */
const SURFACE = {
  dark: { panel: "rgba(148,163,255,0.045)", avatar: "rgba(124,138,255,0.18)" },
  light: { panel: "rgba(70,85,230,0.045)", avatar: "rgba(70,85,230,0.12)" },
} as const;

function useSocialProofSurface() {
  const { theme } = useFunnelTheme();
  return theme === "light" ? SURFACE.light : SURFACE.dark;
}

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function useSocialProofJourney(): SocialProofJourney | null {
  const [journey, setJourney] = useState<SocialProofJourney | null>(null);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setJourney(getOrCreateSocialProofJourney());
    });
    return () => {
      mounted = false;
    };
  }, []);

  return journey;
}

function trackImpressions(
  testimonials: readonly ApprovedTestimonial[],
  placement: SocialProofPlacement,
  groupId: string,
  visibleCount: number,
): void {
  for (const testimonial of testimonials) {
    trackEvent(FIRST_PARTY_EVENTS.socialProofImpression, {
      meta: false,
      metadata: buildImpressionMetadata(
        testimonial,
        placement,
        groupId,
        visibleCount,
      ),
    });
  }
}

function useVisibleImpression<T extends HTMLElement = HTMLElement>({
  testimonials,
  placement,
  groupId,
  visibleCount,
}: {
  testimonials: readonly ApprovedTestimonial[];
  placement: SocialProofPlacement;
  groupId: string;
  visibleCount: number;
}): RefObject<T | null> {
  const firedRef = useRef(false);
  const nodeRef = useRef<T | null>(null);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const el = nodeRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || firedRef.current) return;
        firedRef.current = true;
        trackImpressions(testimonials, placement, groupId, visibleCount);
        io.disconnect();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [testimonials, placement, groupId, visibleCount]);

  return nodeRef;
}

function TestimonialAvatar({
  testimonial,
  size = 38,
}: {
  testimonial: ApprovedTestimonial;
  size?: number;
}) {
  const [imageOk, setImageOk] = useState(Boolean(testimonial.image));
  const surface = useSocialProofSurface();
  const initial = testimonial.attribution.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: surface.avatar,
        border: "1px solid var(--v2-line)",
        color: "var(--v2-ink-dim)",
        fontSize: Math.max(11, Math.round(size * 0.34)),
        fontWeight: 800,
      }}
    >
      {imageOk ? (
        // Decorative avatar: the customer name is rendered as text.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={testimonial.image}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImageOk(false)}
          style={{
            width: size,
            height: size,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        initial
      )}
    </span>
  );
}

function TestimonialRow({
  testimonial,
  quoteLines = 2,
  avatarSize = 38,
  compact = false,
  fullQuote = false,
}: {
  testimonial: ApprovedTestimonial;
  quoteLines?: number;
  avatarSize?: number;
  compact?: boolean;
  fullQuote?: boolean;
}) {
  return (
    <figure
      style={{
        margin: 0,
        display: "flex",
        // Expanded quotes can run several lines \u2014 align the avatar to the top of
        // the quote so it reads as a column, not a vertically-centred blob.
        alignItems: fullQuote ? "flex-start" : "center",
        gap: compact ? 10 : 12,
        minWidth: 0,
      }}
    >
      <TestimonialAvatar testimonial={testimonial} size={avatarSize} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <blockquote
          style={{
            margin: 0,
            fontSize: compact ? 12.5 : 13.25,
            color: "var(--v2-ink-dim)",
            textAlign: "left",
            lineHeight: fullQuote ? 1.6 : 1.45,
            ...(fullQuote
              ? {}
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: quoteLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }),
          }}
        >
          &ldquo;{fullQuote ? testimonial.fullQuote : testimonial.shortQuote}&rdquo;
        </blockquote>
        <figcaption
          style={{
            fontSize: compact ? 11 : 11.5,
            marginTop: compact ? 4 : 6,
            // Modest local contrast bump (faint \u2192 dim) for the attribution.
            color: "var(--v2-ink-dim)",
            textAlign: "left",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          {"\u2014 "}
          {testimonial.attribution}
        </figcaption>
      </div>
    </figure>
  );
}

export function ResultSocialProof() {
  const journey = useSocialProofJourney();
  const surface = useSocialProofSurface();
  const testimonials = journey?.result ?? [];
  const nodeRef = useVisibleImpression<HTMLElement>({
    testimonials,
    placement: "result_transition",
    groupId: RESULT_GROUP_ID,
    visibleCount: testimonials.length,
  });

  if (testimonials.length === 0) return null;

  return (
    <section
      ref={nodeRef}
      aria-label="Customer experiences"
      style={{
        display: "grid",
        gap: 9,
        padding: "11px 12px",
        borderRadius: 16,
        border: "1px solid var(--v2-line)",
        background: surface.panel,
      }}
    >
      {testimonials.map((testimonial) => (
        <TestimonialRow
          key={testimonial.id}
          testimonial={testimonial}
          quoteLines={2}
          avatarSize={38}
          compact
        />
      ))}
    </section>
  );
}

export function PaywallSocialProofDisclosure() {
  const journey = useSocialProofJourney();
  const surface = useSocialProofSurface();
  const [open, setOpen] = useState(false);
  const expandedTrackedRef = useRef(false);
  const extraImpressionsTrackedRef = useRef(false);

  const primary = journey?.paywall[0];
  const expanded = journey?.paywall.slice(1, 3) ?? [];
  const initialTestimonials = primary ? [primary] : [];
  const nodeRef = useVisibleImpression<HTMLDetailsElement>({
    testimonials: initialTestimonials,
    placement: "paywall_post_checkout",
    groupId: PAYWALL_GROUP_ID,
    visibleCount: initialTestimonials.length,
  });

  if (!primary) return null;

  return (
    <details
      ref={nodeRef}
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        setOpen(isOpen);
        if (!isOpen || expandedTrackedRef.current) return;
        expandedTrackedRef.current = true;
        trackEvent(FIRST_PARTY_EVENTS.socialProofExpanded, {
          meta: false,
          metadata: {
            placement: "paywall_post_checkout",
            group_id: PAYWALL_GROUP_ID,
            visible_count_before: 1,
            visible_count_after: 1 + expanded.length,
          },
        });
        if (!extraImpressionsTrackedRef.current && expanded.length > 0) {
          extraImpressionsTrackedRef.current = true;
          trackImpressions(
            expanded,
            "paywall_post_checkout",
            PAYWALL_GROUP_ID,
            1 + expanded.length,
          );
        }
      }}
      style={{
        borderRadius: 16,
        border: "1px solid var(--v2-line)",
        background: surface.panel,
        overflow: "hidden",
      }}
    >
      <summary
        className="social-proof-summary"
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 10,
          padding: "11px 12px",
        }}
      >
        <span style={visuallyHidden}>Show more customer experiences</span>
        <TestimonialRow
          testimonial={primary}
          quoteLines={3}
          avatarSize={40}
          fullQuote={open}
        />
        <ChevronDown
          aria-hidden="true"
          size={17}
          strokeWidth={2.4}
          style={{
            color: "var(--v2-ink-faint)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
          }}
        />
      </summary>

      {open && expanded.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: "0 12px 12px",
          }}
        >
          {expanded.map((testimonial) => (
            <div
              key={testimonial.id}
              style={{
                borderTop: "1px solid var(--v2-line)",
                paddingTop: 10,
              }}
            >
              <TestimonialRow
                testimonial={testimonial}
                quoteLines={3}
                avatarSize={40}
                fullQuote
              />
            </div>
          ))}
        </div>
      )}
    </details>
  );
}

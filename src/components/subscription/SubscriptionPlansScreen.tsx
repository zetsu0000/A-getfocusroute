"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Shield,
  RotateCcw,
  Eye,
  ListChecks,
  LifeBuoy,
  RefreshCw,
  ClipboardCheck,
  Library,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Appearance } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useQuizStore } from "@/store/quizStore";
import { HudLabel } from "@/components/v2/primitives";
import { PaywallSocialProofDisclosure } from "@/components/signature/SocialProof";
import { useFunnelTheme, type FunnelTheme } from "@/components/v2/FunnelThemeProvider";
import {
  createAnalyticsEventId,
  getAnalyticsContext,
  getOrCreateActionEventId,
  trackEvent,
} from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import {
  buildPaywallViewedMetadata,
  buildPaymentAttemptMetadata,
  buildPlanAnalyticsMetadata,
  checkoutAnalyticsStorageKey,
  planSelectAnalyticsDecision,
  resolvePaymentFailureMetadata,
  type SubscriptionPaymentFailureStage,
} from "@/lib/analytics/subscriptionFunnel";
import {
  PLAN_LIST,
  PLANS,
  DEFAULT_PLAN_KEY,
  formatMoney,
  introPerDayCents,
  introWindowLabel,
  renewalCadenceLabel,
  renewalSuffix,
  type PlanDisplay,
  type PlanKey,
} from "@/lib/billing/plans";

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) {
    _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return _stripePromise;
}

/* Client-safe product_key per plan — analytics only (the server resolves the
   authoritative product_key + Price IDs from the plan_key it receives). */
const PRODUCT_KEY_BY_PLAN: Record<PlanKey, string> = {
  plan_1week: "membership_1week",
  plan_4week: "membership_4week",
  plan_12week: "membership_12week",
};

/* Payment Element appearance — mirrors the membership/paywall checkout so the
   3-plan flow reads identically in both the dark Observatory and the daylight
   identity. */
function buildAppearance(theme: FunnelTheme): Appearance {
  if (theme === "light") {
    return {
      theme: "stripe",
      variables: {
        colorPrimary: "#4655E6",
        colorBackground: "#FFFFFF",
        colorText: "#0E1124",
        colorTextSecondary: "#5A6079",
        colorTextPlaceholder: "#9AA0B8",
        colorDanger: "#C53A2E",
        fontFamily: "inherit",
        borderRadius: "12px",
      },
      rules: {
        ".Input": {
          border: "1.5px solid rgba(48,64,150,0.22)",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(20,30,90,0.05)",
        },
        ".Input:focus": {
          border: "1.5px solid rgba(70,85,230,0.85)",
          boxShadow: "0 0 0 3px rgba(70,85,230,0.14)",
        },
        ".Tab--selected": {
          border: "1.5px solid rgba(70,85,230,0.85)",
          backgroundColor: "rgba(70,85,230,0.08)",
          color: "#0E1124",
        },
      },
    };
  }
  return {
    theme: "night",
    variables: {
      colorPrimary: "#9BE8FF",
      colorBackground: "#10131F",
      colorText: "#EEF1FF",
      colorDanger: "#FF8B8B",
      fontFamily: "inherit",
      borderRadius: "12px",
    },
  };
}

/* ── One plan card — full-card clickable, radio-group semantics ───────────── */
function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: PlanDisplay;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const perDay = formatMoney(introPerDayCents(plan));

  return (
    <m.button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${plan.name}: ${formatMoney(plan.introAmount)} for ${introWindowLabel(
        plan,
      )}, then ${formatMoney(plan.renewalAmount)} per ${renewalCadenceLabel(plan)}`}
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 20,
        overflow: "hidden",
        background: isSelected
          ? "linear-gradient(150deg, rgba(var(--v2-signal-rgb),0.14), rgba(var(--v2-cyan-rgb),0.05))"
          : "linear-gradient(165deg, rgba(148,163,255,0.07), rgba(148,163,255,0.03))",
        border: isSelected
          ? "2px solid rgba(var(--v2-signal-rgb),0.8)"
          : "2px solid var(--v2-line)",
        boxShadow: isSelected
          ? dark
            ? "0 0 0 1px rgba(var(--v2-signal-rgb),0.25), 0 16px 50px rgba(var(--v2-signal-rgb),0.2)"
            : "0 0 0 1px rgba(70,85,230,0.25), 0 16px 44px rgba(70,85,230,0.18)"
          : dark
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 36px rgba(2,3,10,0.45)"
            : "inset 0 1px 0 rgba(255,255,255,0.8), var(--v2-shadow-md)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "box-shadow 0.2s, border-color 0.2s, background 0.2s",
        cursor: "pointer",
      }}
    >
      {plan.popular && (
        <div
          style={{
            padding: "8px 20px",
            background: "var(--v2-grad-signal)",
            color: dark ? "#06070D" : "#FFFFFF",
            fontFamily: "var(--v2-font-mono)",
            fontSize: 10.5,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "0.14em",
          }}
        >
          MOST POPULAR
        </div>
      )}

      <div style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <HudLabel tone="dim" style={{ marginBottom: 8, fontSize: 9.5 }}>{plan.name}</HudLabel>

            {/* Intro charge — what the customer pays today. */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                className="v2-display"
                style={{ fontSize: 30, fontWeight: 600, color: "var(--v2-ink)", lineHeight: 1 }}
              >
                {formatMoney(plan.introAmount)}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--v2-ink-dim)" }}>
                for {introWindowLabel(plan)}
              </span>
            </div>

            {/* Per-day — the prominent value cue ($0.42/day). */}
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--v2-signal-2)",
              }}
            >
              {perDay}/day
            </p>

            {/* Renewal — honest step-up after the intro window. */}
            <p style={{ fontSize: 12, color: "var(--v2-ink-dim)", marginTop: 4 }}>
              then {formatMoney(plan.renewalAmount)}
              {renewalSuffix(plan)} after {introWindowLabel(plan)}
            </p>

            {/* Why this duration is recommended — small secondary note, on the
               default plan only. Based on having time to use the product, not
               urgency or a fabricated statistic. */}
            {plan.popular && (
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--v2-signal-2)",
                  lineHeight: 1.4,
                  marginTop: 8,
                }}
              >
                Recommended: enough time to use it, adjust it, and repeat what
                works.
              </p>
            )}
          </div>

          {/* Radio indicator. */}
          <div
            style={{
              marginTop: 4,
              width: 22,
              height: 22,
              borderRadius: "50%",
              flexShrink: 0,
              border: `2px solid ${isSelected ? "var(--v2-signal)" : "var(--v2-line-bright)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isSelected ? "0 0 12px rgba(var(--v2-signal-rgb),0.5)" : "none",
            }}
          >
            {isSelected && (
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--v2-grad-signal)",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </m.button>
  );
}

/* ── Order summary — instant update on selection ─────────────────────────── */
function OrderSummary({ plan }: { plan: PlanDisplay }) {
  const row = (label: string, value: string, strong = false) => (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--v2-ink-dim)" }}>{label}</span>
      <span
        style={{
          fontSize: strong ? 15 : 13,
          fontWeight: strong ? 800 : 600,
          color: strong ? "var(--v2-ink)" : "var(--v2-ink-dim)",
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 9,
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(var(--v2-signal-rgb),0.05)",
        border: "1px solid var(--v2-line)",
      }}
    >
      {row(`${plan.name} — due today`, formatMoney(plan.introAmount), true)}
      {row(
        `Renews after ${introWindowLabel(plan)}`,
        `${formatMoney(plan.renewalAmount)}/${renewalCadenceLabel(plan)}`,
      )}
    </div>
  );
}

/* ── Payment form (embedded Payment Element → /api/billing/checkout) ──────── */
function PlanCheckoutForm({
  plan,
  email,
  userName,
  quizResultId,
  onSuccess,
}: {
  plan: PlanDisplay;
  email: string;
  userName: string;
  quizResultId: string | null;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutIntentTracked = useRef(false);
  const attemptCounterRef = useRef(0);
  const currentAttemptIdRef = useRef<string | null>(null);
  const productKey = PRODUCT_KEY_BY_PLAN[plan.key];
  // Stable per plan + checkout session — Pixel InitiateCheckout, CAPI, and the
  // billing request must share this ID. Retries rotate attemptId only.
  const checkoutEventId = useMemo(
    () =>
      getOrCreateActionEventId(
        checkoutAnalyticsStorageKey(plan.key),
        "initiate_checkout",
      ),
    [plan.key],
  );

  const trackPaymentFailure = (
    stage: SubscriptionPaymentFailureStage,
    stripeError?: { type?: string; code?: string } | null,
  ) => {
    const metadata = resolvePaymentFailureMetadata(
      plan,
      stage,
      attemptCounterRef.current,
      currentAttemptIdRef.current,
      stripeError,
    );
    const actionEventId = currentAttemptIdRef.current;
    trackEvent(FIRST_PARTY_EVENTS.paymentError, {
      meta: false,
      ...(actionEventId ? { eventId: actionEventId } : {}),
      metadata,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setError(null);
    // A new submit starts a fresh attempt context; retry validation errors
    // must not reuse the previous attempt ID.
    currentAttemptIdRef.current = null;

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message ?? "Error");
      trackPaymentFailure("element_submit", submitErr);
      setLoading(false);
      return;
    }

    attemptCounterRef.current += 1;
    const attemptId = createAnalyticsEventId("payment_attempt");
    currentAttemptIdRef.current = attemptId;

    trackEvent(FIRST_PARTY_EVENTS.paymentAttempted, {
      meta: false,
      eventId: attemptId,
      metadata: buildPaymentAttemptMetadata(plan, attemptCounterRef.current, attemptId),
    });

    if (!checkoutIntentTracked.current) {
      checkoutIntentTracked.current = true;
      trackEvent(FIRST_PARTY_EVENTS.checkoutIntent, {
        eventId: checkoutEventId,
        metadata: buildPaywallViewedMetadata(plan),
      });
    }

    const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({ elements });
    if (pmErr || !paymentMethod) {
      setError(pmErr?.message ?? "Error creating payment");
      trackPaymentFailure("create_payment_method", pmErr);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_key: plan.key,
        email,
        paymentMethodId: paymentMethod.id,
        funnel_step: "subscription",
        quiz_result_id: quizResultId ?? "",
        user_name: userName.trim(),
        analytics_event_id: checkoutEventId,
        analytics_context: getAnalyticsContext(),
      }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
      trackPaymentFailure("billing_checkout");
      setLoading(false);
      return;
    }

    if (data.clientSecret) {
      if (typeof data.subscriptionId !== "string" || !data.subscriptionId) {
        setError("Unable to initialize subscription payment verification. Please try again.");
        trackPaymentFailure("subscription_verification_evidence");
        setLoading(false);
        return;
      }
      // Server-verified success only: the return_url carries subscription_id,
      // which AssessmentClient re-verifies against Stripe before unlocking.
      const { error: confirmErr } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url:
            window.location.origin +
            `/assessment?step=success&subscription_id=${encodeURIComponent(data.subscriptionId)}`,
        },
        redirect: "if_required",
      });
      if (confirmErr) {
        setError(confirmErr.message ?? "Payment failed");
        trackPaymentFailure("confirm_payment", confirmErr);
        setLoading(false);
        return;
      }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PaymentElement
        onReady={() => {
          trackEvent(FIRST_PARTY_EVENTS.paymentElementLoaded, {
            meta: false,
            metadata: { product_key: productKey, plan_key: plan.key },
          });
        }}
        options={{
          layout: "tabs",
          // Customer-facing business name in the Payment Element (mandate /
          // terms text). The legal entity stored in Stripe is unchanged.
          business: { name: "FocusRoute" },
          // Default the billing country to the US; the customer can still
          // change it in the Element.
          defaultValues: { billingDetails: { address: { country: "US" } } },
        }}
      />
      {error && (
        <p
          style={{
            fontSize: 13,
            color: "var(--v2-error)",
            textAlign: "center",
            background: "rgba(255,139,139,0.1)",
            border: "1px solid rgba(255,139,139,0.3)",
            borderRadius: 12,
            padding: "9px 12px",
          }}
        >
          {error}
        </p>
      )}
      {/* Single billing disclosure near the final payment action. */}
      <p
        style={{
          fontSize: 11.5,
          color: "var(--v2-ink-faint)",
          textAlign: "center",
          lineHeight: 1.55,
        }}
      >
        Intro price today. Renews at the regular price shown. Cancel anytime.
      </p>
      <m.button
        type="submit"
        disabled={!stripe || loading}
        whileTap={{ scale: 0.975 }}
        whileHover={loading ? undefined : { y: -1 }}
        className={loading ? undefined : "v2-cta"}
        style={{
          width: "100%",
          minHeight: 58,
          padding: "18px 24px",
          borderRadius: 999,
          fontSize: 16,
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          ...(loading
            ? {
                background: "rgba(148,163,255,0.06)",
                border: "1px solid var(--v2-line)",
                color: "var(--v2-ink-faint)",
              }
            : {}),
        }}
      >
        {loading ? "Processing..." : "Get My FocusRoute"}
      </m.button>
    </form>
  );
}

/* ── Animated value route (GSAP) ──────────────────────────────────────────────
   A compact SVG route that draws through three immediate-use stages
   (understand → act → get back on track) and continues into a small recurring
   loop, leading the eye into plan selection. GSAP is progressive enhancement:
   every line, marker, and the recurring cycle render fully in the static HTML,
   so the module is complete and readable if JS/GSAP/ScrollTrigger never run or
   reduced motion is on. GSAP only animates opacity / transform /
   strokeDashoffset / the travelling-node position — never theme colours, which
   stay in CSS variables so a light/dark toggle never rebuilds the timeline.

   Stage copy lines map to capabilities that genuinely ship to active
   subscribers: the detailed focus breakdown, the 28-day protocol, and the
   member bonus library; the recurring loop maps to member-only retakes. */
const ROUTE_PATH_D = "M 16 44 C 74 44 92 18 156 24 C 222 30 248 50 304 30";
/* Decorative fallback marker coordinates (used until GSAP places them exactly on
   the path via getPointAtLength, and in the no-JS case). */
const MARKER_FALLBACK = [
  { cx: 52, cy: 40 },
  { cx: 156, cy: 24 },
  { cx: 286, cy: 34 },
] as const;
/* Path-progress positions where each stage marker and the travelling node sit. */
const MARKER_FRACTIONS = [0.1, 0.5, 0.9] as const;

const ROUTE_STAGES = [
  {
    key: "understand",
    rgb: "--v2-signal-rgb",
    icon: Eye,
    eyebrow: "01 — UNDERSTAND",
    title: "Understand what's getting in your way",
    desc: "See the full breakdown behind starting, staying focused, prioritizing, planning, remembering, and getting back on track.",
    label: "Your detailed focus breakdown",
  },
  {
    key: "act",
    rgb: "--v2-cyan-rgb",
    icon: ListChecks,
    eyebrow: "02 — ACT",
    title: "Know what to do next",
    desc: "Follow a 28-day path of small actions built from your answers.",
    label: "Your 28-day action path",
  },
  {
    key: "recover",
    rgb: "--v2-gold-rgb",
    icon: LifeBuoy,
    eyebrow: "03 — GET BACK ON TRACK",
    title: "Have help when the day goes off track",
    desc: "Use scripts, planners, and practical guides when focus breaks again.",
    label: "Your member tools",
  },
] as const;

const ROUTE_RECURRING = [
  { icon: RotateCcw, title: "RETAKE", meaning: "When work or life changes" },
  { icon: RefreshCw, title: "REFRESH", meaning: "Update your results and next steps" },
  { icon: ClipboardCheck, title: "REVIEW", meaning: "See what's working and adjust a step" },
  { icon: Library, title: "KEEP USING", meaning: "Return to your member tools and guides" },
] as const;

function CheckoutValueRoute() {
  const rootRef = useRef<HTMLDivElement>(null);
  const routePathRef = useRef<SVGPathElement>(null);
  const travelNodeRef = useRef<SVGCircleElement>(null);

  // GSAP runs as enhancement after mount. useLayoutEffect applies the motion
  // start-states before paint (no visible→hidden flash); if anything is missing
  // the function bails and the static, fully-visible markup stands.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const path = routePathRef.current;
    const node = travelNodeRef.current;
    if (!root || !path || !node) return;

    gsap.registerPlugin(ScrollTrigger);
    let cancelled = false;

    const ctx = gsap.context((self) => {
      const q = self.selector as <T extends Element>(s: string) => T[];
      const len = path.getTotalLength();
      const markers = q<SVGCircleElement>(".fr-marker");
      const stages = q<HTMLElement>(".fr-stage");
      const recurItems = q<HTMLElement>(".fr-recur-item");
      const recurHead = q<HTMLElement>(".fr-recur-head");
      const heading = q<HTMLElement>(".fr-route-heading");
      const freeLine = q<HTMLElement>(".fr-free-line");
      const loopPath = q<SVGPathElement>(".fr-recur-loop")[0];

      // Place markers exactly on the path (resolution-independent user units).
      markers.forEach((marker, i) => {
        const pt = path.getPointAtLength(len * (MARKER_FRACTIONS[i] ?? 0));
        gsap.set(marker, { attr: { cx: pt.x, cy: pt.y } });
      });

      const routeProgress = { value: 0 };
      const updateTravelNode = () => {
        const pt = path.getPointAtLength(len * routeProgress.value);
        gsap.set(node, { attr: { cx: pt.x, cy: pt.y } });
      };
      updateTravelNode();
      const offsetAt = (progress: number) => len * (1 - progress);

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (mctx) => {
          // Reduced motion (and the static default) is already the complete
          // final state — fully-drawn route, visible markers/copy, hidden node.
          if (mctx.conditions?.reduce) {
            gsap.set(node, { opacity: 0 });
            return;
          }

          // Motion: apply start-states now (init succeeded), then play once.
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          gsap.set(node, { opacity: 0 });
          gsap.set(markers, { opacity: 0.45, attr: { r: 3.5 } });
          gsap.set([...heading, ...stages, ...recurHead, ...recurItems, ...freeLine], {
            opacity: 0,
            y: 10,
            willChange: "transform, opacity",
          });
          if (loopPath) {
            const loopLen = loopPath.getTotalLength();
            gsap.set(loopPath, { strokeDasharray: loopLen, strokeDashoffset: loopLen });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: "top 82%",
              once: true,
              toggleActions: "play none none none",
            },
            onComplete: () => {
              gsap.set([...heading, ...stages, ...recurHead, ...recurItems, ...freeLine], {
                willChange: "auto",
              });
            },
          });

          tl.to(heading, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 0)
            .to(node, { opacity: 1, duration: 0.2 }, 0.08);

          // Three stages: draw path → travel node → activate marker → reveal copy.
          MARKER_FRACTIONS.forEach((frac, i) => {
            const at = 0.1 + i * 0.42;
            tl.to(path, { strokeDashoffset: offsetAt(frac), duration: 0.34, ease: "power2.inOut" }, at)
              .to(routeProgress, { value: frac, duration: 0.34, ease: "power2.inOut", onUpdate: updateTravelNode }, at)
              .to(markers[i], { opacity: 1, attr: { r: 5 }, duration: 0.25, ease: "back.out(1.5)" }, at + 0.1)
              .to(stages[i], { y: 0, opacity: 1, duration: 0.32, ease: "power2.out" }, at + 0.16);
          });

          // Continue into the recurring loop; finish the path and retire the node.
          tl.to(path, { strokeDashoffset: offsetAt(1), duration: 0.3, ease: "power2.inOut" }, 1.4)
            .to(routeProgress, { value: 1, duration: 0.3, ease: "power2.inOut", onUpdate: updateTravelNode }, 1.4)
            .to(node, { opacity: 0, duration: 0.25 }, 1.55)
            .to(recurHead, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 1.5);
          if (loopPath) {
            tl.to(loopPath, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 1.55);
          }
          tl.to(recurItems, { y: 0, opacity: 1, duration: 0.24, stagger: 0.07, ease: "power2.out" }, 1.62)
            .to(freeLine, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 1.85);
        },
      );
    }, rootRef);

    // Re-measure once webfonts settle, but never after unmount.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    }

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        padding: "16px 16px",
        borderRadius: 16,
        border: "1px solid var(--v2-line)",
        background: "rgba(var(--v2-signal-rgb),0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <HudLabel className="fr-route-heading" tone="signal" style={{ fontSize: 10 }}>
        What you unlock
      </HudLabel>

      {/* Decorative route — the visible benefit text is real HTML below. */}
      <svg
        viewBox="0 0 320 64"
        width="100%"
        style={{ display: "block", height: "auto" }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="fr-route-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: "rgb(var(--v2-signal-rgb))" }} />
            <stop offset="55%" style={{ stopColor: "rgb(var(--v2-cyan-rgb))" }} />
            <stop offset="100%" style={{ stopColor: "rgb(var(--v2-gold-rgb))" }} />
          </linearGradient>
        </defs>
        <path d={ROUTE_PATH_D} fill="none" stroke="var(--v2-line-bright)" strokeWidth={2} strokeLinecap="round" />
        <path
          ref={routePathRef}
          d={ROUTE_PATH_D}
          fill="none"
          stroke="url(#fr-route-grad)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {ROUTE_STAGES.map((s, i) => (
          <circle
            key={s.key}
            className="fr-marker"
            cx={MARKER_FALLBACK[i].cx}
            cy={MARKER_FALLBACK[i].cy}
            r={5}
            fill={`rgb(var(${s.rgb}))`}
            style={{ filter: `drop-shadow(0 0 5px rgb(var(${s.rgb})))` }}
          />
        ))}
        <circle
          ref={travelNodeRef}
          cx={MARKER_FALLBACK[0].cx}
          cy={MARKER_FALLBACK[0].cy}
          r={3}
          fill="var(--v2-ink)"
          style={{ opacity: 0, filter: "drop-shadow(0 0 5px rgb(var(--v2-cyan-rgb)))" }}
        />
      </svg>

      {/* Three immediate-use stages */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ROUTE_STAGES.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="fr-stage"
              data-stage={s.key}
              style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 12, alignItems: "start" }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `rgba(var(${s.rgb}),0.12)`,
                  border: `1px solid rgba(var(${s.rgb}),0.32)`,
                }}
              >
                <Icon size={16} color={`rgb(var(${s.rgb}))`} strokeWidth={2.2} />
              </span>
              <div>
                <span
                  className="v2-hud"
                  style={{ display: "block", fontSize: 9.5, color: `rgb(var(${s.rgb}))`, marginBottom: 3 }}
                >
                  {s.eyebrow}
                </span>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.25 }}>
                  {s.title}
                </p>
                <p style={{ fontSize: 15, color: "var(--v2-ink-dim)", lineHeight: 1.5, marginTop: 4 }}>
                  {s.desc}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    padding: "2px 9px",
                    borderRadius: 999,
                    fontFamily: "var(--v2-font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                    color: `rgb(var(${s.rgb}))`,
                    background: `rgba(var(${s.rgb}),0.1)`,
                    border: `1px solid rgba(var(${s.rgb}),0.24)`,
                  }}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recurring value — the route loops back, kept compact (not a card wall) */}
      <div>
        <div className="fr-recur-head" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <path
              className="fr-recur-loop"
              d="M 20 12 A 8 8 0 1 1 12 4"
              fill="none"
              stroke="rgb(var(--v2-signal-rgb))"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path d="M 12 1.5 L 12 6.5 L 16 4" fill="none" stroke="rgb(var(--v2-signal-rgb))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <HudLabel tone="signal" style={{ fontSize: 9.5 }}>
            Why it keeps helping
          </HudLabel>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {ROUTE_RECURRING.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="fr-recur-item"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "9px 10px",
                  borderRadius: 12,
                  background: "rgba(var(--v2-signal-rgb),0.05)",
                  border: "1px solid var(--v2-line)",
                }}
              >
                <Icon size={14} color="var(--v2-signal-2)" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11.5, color: "var(--v2-ink-dim)", lineHeight: 1.4 }}>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--v2-font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      fontWeight: 700,
                      color: "var(--v2-ink)",
                      marginBottom: 1,
                    }}
                  >
                    {step.title}
                  </span>
                  {step.meaning}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free result vs subscription — one concise, honest distinction. */}
      <p
        className="fr-free-line"
        style={{
          margin: 0,
          paddingLeft: 12,
          borderLeft: "2px solid rgba(var(--v2-signal-rgb),0.5)",
          fontSize: 13,
          color: "var(--v2-ink-dim)",
          lineHeight: 1.55,
        }}
      >
        Your free result shows what may be getting in the way. FocusRoute unlocks
        the full breakdown, a 28-day action path, and practical tools you can
        return to.
      </p>
    </div>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */
export function SubscriptionPlansScreen() {
  const { name, email, setStep, quizResultId } = useQuizStore();
  const { theme } = useFunnelTheme();

  const [selected, setSelected] = useState<PlanKey>(DEFAULT_PLAN_KEY);
  const [showPayment, setShowPayment] = useState(false);
  const plan = PLANS[selected];

  const cardsRef = useRef<HTMLDivElement>(null);

  const viewTracked = useRef(false);
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackEvent(FIRST_PARTY_EVENTS.subscriptionViewed, { meta: false });
  }, []);

  // Plan-card entrance — its own one-shot ScrollTrigger so the plans never
  // depend on the value-route timeline. Cards start 82% visible (not hidden),
  // and stay fully visible if GSAP/ScrollTrigger never run or motion is reduced.
  useLayoutEffect(() => {
    const el = cardsRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    let cancelled = false;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el.children,
          { y: 18, opacity: 0.82 },
          {
            y: 0,
            opacity: 1,
            duration: 0.42,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });
    }, cardsRef);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    }
    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  const handleSuccess = () => setStep("success");

  const handlePlanSelect = (nextKey: PlanKey) => {
    const decision = planSelectAnalyticsDecision(selected, nextKey);
    if (decision.trackPlanSelected) {
      trackEvent(FIRST_PARTY_EVENTS.planSelected, {
        meta: false,
        metadata: buildPlanAnalyticsMetadata(PLANS[nextKey]),
      });
    }
    if (decision.updateUiState) {
      setSelected(nextKey);
      setShowPayment(false);
    }
  };

  const handleRevealSecureCheckout = () => {
    if (showPayment) return;
    setShowPayment(true);
    trackEvent(FIRST_PARTY_EVENTS.secureCheckoutRevealed, {
      meta: false,
      metadata: buildPlanAnalyticsMetadata(plan),
    });
    // Legacy Meta ViewContent bridge — keep for backward-compatible reporting.
    // Canonical subscription checkout reveal: secure_checkout_revealed.
    trackEvent(FIRST_PARTY_EVENTS.paywallViewed, {
      metadata: buildPaywallViewedMetadata(plan),
    });
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      // Extra bottom inset so the final CTA clears the iOS Safari bottom bar.
      style={{
        minHeight: "100dvh",
        padding: "32px 16px calc(110px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header — eyebrow + benefit headline (the first visual focus) */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ paddingTop: 10 }}
        >
          <HudLabel tone="signal" style={{ marginBottom: 12, fontSize: 11 }}>
            MAKE FOCUS EASIER
          </HudLabel>
          <h1
            className="v2-display"
            style={{
              fontSize: "clamp(31px, 8.6vw, 40px)",
              fontWeight: 560,
              lineHeight: 1.14,
              letterSpacing: "-0.01em",
              marginBottom: 12,
              color: "var(--v2-ink)",
            }}
          >
            Get the guidance and tools to start, stay on track, and get back to
            what matters.
          </h1>
          <p style={{ fontSize: 17, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>
            Unlock your full breakdown, a 28-day action path, and practical tools
            for difficult moments.
          </p>
        </m.div>

        {/* Animated value route — immediate use + ongoing value */}
        <CheckoutValueRoute />

        {/* Plan cards — accessible radio group (GSAP one-shot entrance) */}
        <div
          ref={cardsRef}
          role="radiogroup"
          aria-label="Membership plan"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {PLAN_LIST.map((p) => (
            <PlanCard
              key={p.key}
              plan={p}
              isSelected={selected === p.key}
              onSelect={() => handlePlanSelect(p.key)}
            />
          ))}
        </div>

        {/* Order summary → social proof → CTA / payment */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="v2-panel"
          style={{ padding: "22px 22px", display: "flex", flexDirection: "column", gap: 16 }}
        >
          <OrderSummary plan={plan} />

          {/* Restored expandable customer proof, before the payment action. */}
          <PaywallSocialProofDisclosure />

          {!showPayment ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <m.button
                type="button"
                onClick={handleRevealSecureCheckout}
                whileTap={{ scale: 0.975 }}
                whileHover={{ y: -1 }}
                className="v2-cta"
                style={{ width: "100%", minHeight: 58, padding: "18px 24px", fontSize: 16, fontWeight: 800 }}
              >
                Continue to secure checkout
              </m.button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
                {[
                  { icon: Shield, label: "SSL Secure" },
                  { icon: RotateCcw, label: "Cancel anytime" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <Icon size={15} color="var(--v2-signal-2)" />
                    <span className="v2-hud" style={{ fontSize: 8.5 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Elements
              stripe={getStripePromise()}
              options={{
                mode: "subscription",
                amount: plan.introAmount,
                currency: plan.currency,
                // Force the Stripe Payment Element UI to English regardless of
                // the visitor's browser locale.
                locale: "en",
                appearance: buildAppearance(theme),
              }}
            >
              <PlanCheckoutForm
                plan={plan}
                email={email}
                userName={name}
                quizResultId={quizResultId}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </m.div>
      </div>
    </m.div>
  );
}

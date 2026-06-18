"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import { Shield, RotateCcw, Compass, TrendingUp } from "lucide-react";
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

/* ── Compact product-value route ──────────────────────────────────────────────
   Three connected stops tied to the funnel pain — start, recover, follow
   through — kept deliberately compact (no SaaS cards, no paragraphs). */
const VALUE_STEPS = [
  {
    icon: Compass,
    title: "Know where to start",
    meaning: "A clearer first move when priorities compete.",
  },
  {
    icon: RotateCcw,
    title: "Know how to recover",
    meaning: "A route back when pressure or interruption breaks focus.",
  },
  {
    icon: TrendingUp,
    title: "Keep moving forward",
    meaning: "Progress without rebuilding the entire plan.",
  },
] as const;

function ValueRoute() {
  return (
    <ul
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        listStyle: "none",
        margin: 0,
        padding: 0,
      }}
    >
      {VALUE_STEPS.map((step, i) => {
        const Icon = step.icon;
        const last = i === VALUE_STEPS.length - 1;
        return (
          <li
            key={step.title}
            style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 12 }}
          >
            {/* Node + connector — the "route" thread. */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "rgba(var(--v2-signal-rgb),0.12)",
                  border: "1px solid rgba(var(--v2-signal-rgb),0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={14} color="var(--v2-signal-2)" strokeWidth={2.2} />
              </div>
              {!last && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 14,
                    marginTop: 2,
                    background:
                      "linear-gradient(rgba(var(--v2-signal-rgb),0.45), rgba(var(--v2-signal-rgb),0.08))",
                  }}
                />
              )}
            </div>
            {/* Stop copy. */}
            <div style={{ paddingBottom: last ? 0 : 14 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.3 }}>
                {step.title}
              </p>
              <p style={{ fontSize: 12.5, color: "var(--v2-ink-dim)", lineHeight: 1.5, marginTop: 2 }}>
                {step.meaning}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */
export function SubscriptionPlansScreen() {
  const { name, email, setStep, quizResultId } = useQuizStore();
  const { theme } = useFunnelTheme();

  const [selected, setSelected] = useState<PlanKey>(DEFAULT_PLAN_KEY);
  const [showPayment, setShowPayment] = useState(false);
  const plan = PLANS[selected];

  const viewTracked = useRef(false);
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackEvent(FIRST_PARTY_EVENTS.subscriptionViewed, { meta: false });
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
        {/* Header — approved opening (headline + one supporting line, no eyebrow) */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h1
            className="v2-display"
            style={{ fontSize: "clamp(25px, 6.4vw, 31px)", fontWeight: 550, lineHeight: 1.2, marginBottom: 9 }}
          >
            Stop starting over.
          </h1>
          <p style={{ fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.65 }}>
            Your answers showed where focus breaks. Choose the plan that helps you
            start, recover, and follow through.
          </p>
        </m.div>

        {/* Compact product-value route */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            padding: "16px 16px",
            borderRadius: 16,
            border: "1px solid var(--v2-line)",
            background: "rgba(var(--v2-signal-rgb),0.04)",
          }}
        >
          <ValueRoute />
        </m.div>

        {/* Plan cards — accessible radio group */}
        <m.div
          role="radiogroup"
          aria-label="Membership plan"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
        </m.div>

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

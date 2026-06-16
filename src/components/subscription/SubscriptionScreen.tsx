"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Check, Shield, RotateCcw } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js/pure";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useQuizStore } from "@/store/quizStore";
import { safeName } from "@/lib/personalization";
import { BRAIN_OS } from "@/lib/positioning";
import { HudLabel } from "@/components/v2/primitives";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import {
  getAnalyticsContext,
  getOrCreateActionEventId,
  trackEvent,
} from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return _stripePromise;
}

const PLANS = {
  annual: {
    priceId:    process.env.NEXT_PUBLIC_PRICE_ANNUAL!,
    label:      "Membership Annual",
    price:      BRAIN_OS.price.membershipAnnual,
    amount:     Math.round(BRAIN_OS.price.membershipAnnualValue * 100),
    sub:        `~$${(BRAIN_OS.price.membershipAnnualValue / 12).toFixed(2)}/mo · billed yearly`,
    oldPrice:   BRAIN_OS.price.membershipMonthlyValue > 0 ? `$${(BRAIN_OS.price.membershipMonthlyValue * 12).toFixed(0)}` : null,
    savings:    BRAIN_OS.price.membershipMonthlyValue > 0
      ? `Save ${Math.max(0, Math.round(((BRAIN_OS.price.membershipMonthlyValue * 12 - BRAIN_OS.price.membershipAnnualValue) / (BRAIN_OS.price.membershipMonthlyValue * 12)) * 100))}%`
      : null,
    badge:      "BEST VALUE",
    highlight:  true,
  },
  monthly: {
    priceId:    process.env.NEXT_PUBLIC_PRICE_MONTHLY!,
    label:      "Membership Monthly",
    price:      BRAIN_OS.price.membershipMonthly,
    amount:     Math.round(BRAIN_OS.price.membershipMonthlyValue * 100),
    sub:        "per month · cancel anytime",
    oldPrice:   null,
    savings:    null,
    badge:      null,
    highlight:  false,
  },
};

const FEATURES = [
  "Keep your FocusRoute system current with profile updates",
  "Retake your assessment as your routines and context change",
  "Access billing tools and membership controls in one place",
  "Receive future report and protocol library improvements",
];

/* Checkout form for subscriptions */
function SubCheckoutForm({
  priceId,
  email,
  userName,
  quizResultId,
  onSuccess,
  ctaLabel,
}: {
  priceId: string;
  email: string;
  userName: string;
  quizResultId: string | null;
  onSuccess: () => void;
  ctaLabel: string;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const checkoutTracked = useRef(false);

  const trackPaymentError = (stage: string) => {
    trackEvent(FIRST_PARTY_EVENTS.paymentError, {
      meta: false,
      metadata: { product_key: selectedProductKey(priceId), stage },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const checkoutEventId = getOrCreateActionEventId(`subscription_${priceId}`, "initiate_checkout");
    setLoading(true);
    setError(null);
    if (!checkoutTracked.current) {
      checkoutTracked.current = true;
      trackEvent(FIRST_PARTY_EVENTS.checkoutIntent, {
        eventId: checkoutEventId,
        metadata: {
          product_key: selectedProductKey(priceId),
          content_name: "FocusRoute Membership",
          content_ids: ["membership", priceId],
          content_type: "subscription",
          num_items: 1,
        },
      });
    }

    const { error: submitErr } = await elements.submit();
    if (submitErr) { setError(submitErr.message ?? "Error"); trackPaymentError("element_submit"); setLoading(false); return; }

    const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({ elements });
    if (pmErr || !paymentMethod) { setError(pmErr?.message ?? "Error creating payment"); trackPaymentError("create_payment_method"); setLoading(false); return; }

    const res  = await fetch("/api/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
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

    if (data.error) { setError(data.error); trackPaymentError("create_subscription"); setLoading(false); return; }

    if (data.clientSecret) {
      if (typeof data.subscriptionId !== "string" || !data.subscriptionId) {
        setError("Unable to initialize subscription payment verification. Please try again.");
        trackPaymentError("subscription_verification_evidence");
        setLoading(false);
        return;
      }
      const { error: confirmErr } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url:
            window.location.origin +
            `/assessment?step=success&subscription_id=${encodeURIComponent(data.subscriptionId)}`,
        },
        redirect: "if_required",
      });
      if (confirmErr) { setError(confirmErr.message ?? "Payment failed"); trackPaymentError("confirm_payment"); setLoading(false); return; }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PaymentElement
        onReady={() => {
          trackEvent(FIRST_PARTY_EVENTS.paymentElementLoaded, {
            meta: false,
            metadata: { product_key: selectedProductKey(priceId) },
          });
        }}
        options={{ layout: "tabs" }}
      />
      {error && <p style={{ fontSize: 13, color: "var(--v2-error)", textAlign: "center", background: "rgba(255,139,139,0.1)", border: "1px solid rgba(255,139,139,0.3)", borderRadius: 12, padding: "9px 12px" }}>{error}</p>}
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
        {loading ? "Processing..." : ctaLabel}
      </m.button>
      <p style={{ fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center" }}>
        Cancel anytime — manage it from your dashboard
      </p>
    </form>
  );
}

function selectedProductKey(priceId: string): "membership_annual" | "membership_monthly" | "membership" {
  if (priceId === PLANS.annual.priceId) return "membership_annual";
  if (priceId === PLANS.monthly.priceId) return "membership_monthly";
  return "membership";
}

/* Plan selector card */
function PlanCard({ planKey, isSelected, onSelect }: { planKey: "annual" | "monthly"; isSelected: boolean; onSelect: () => void }) {
  const plan = PLANS[planKey];
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  return (
    <m.button
      onClick={onSelect}
      whileTap={{ scale: 0.982 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 20,
        overflow: "hidden",
        background: isSelected
          ? "linear-gradient(150deg, rgba(124,138,255,0.14), rgba(155,232,255,0.05))"
          : "linear-gradient(165deg, rgba(148,163,255,0.07), rgba(148,163,255,0.03))",
        border: isSelected ? "2px solid rgba(124,138,255,0.8)" : "2px solid var(--v2-line)",
        boxShadow: isSelected
          ? (dark
              ? "0 0 0 1px rgba(124,138,255,0.25), 0 16px 50px rgba(124,138,255,0.2)"
              : "0 0 0 1px rgba(70,85,230,0.25), 0 16px 44px rgba(70,85,230,0.18)")
          : (dark
              ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 36px rgba(2,3,10,0.45)"
              : "inset 0 1px 0 rgba(255,255,255,0.8), var(--v2-shadow-md)"),
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "box-shadow 0.2s, border-color 0.2s, background 0.2s",
        cursor: "pointer",
      }}
    >
      {plan.badge && (
        <div style={{
          padding: "8px 20px",
          background: "var(--v2-grad-signal)",
          color: dark ? "#06070D" : "#FFFFFF",
          fontFamily: "var(--v2-font-mono)",
          fontSize: 10.5,
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "0.14em",
        }}>
          {plan.badge}{plan.savings ? ` — ${plan.savings}` : ""}
        </div>
      )}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <HudLabel style={{ marginBottom: 8, fontSize: 9.5 }}>{plan.label}</HudLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span className="v2-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--v2-ink)", lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: "var(--v2-ink-faint)" }}>{planKey === "monthly" ? "/mo" : "/yr"}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", marginTop: 4 }}>{plan.sub}</p>
            {plan.oldPrice && (
              <p style={{ fontSize: 12, color: "var(--v2-ink-ghost)", textDecoration: "line-through", marginTop: 2 }}>{plan.oldPrice}/yr</p>
            )}
          </div>
          <div style={{
            marginTop: 4, width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${isSelected ? "var(--v2-signal)" : "var(--v2-line-bright)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isSelected ? "0 0 12px rgba(124,138,255,0.5)" : "none",
          }}>
            {isSelected && (
              <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--v2-grad-signal)" }} />
            )}
          </div>
        </div>

        {planKey === "annual" && (
          <ul style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--v2-line)", display: "flex", flexDirection: "column", gap: 9, listStyle: "none" }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(127,224,178,0.12)", border: "1px solid rgba(127,224,178,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={9} color="var(--v2-success)" />
                </div>
                <span style={{ fontSize: 12, color: "var(--v2-ink-dim)" }}>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </m.button>
  );
}

/* Main SubscriptionScreen */
export function SubscriptionScreen() {
  const { name, email, setStep, quizResultId } = useQuizStore();
  const displayName = safeName(name, "you");
  const { theme } = useFunnelTheme();

  const [selected, setSelected] = useState<"annual" | "monthly">("annual");
  const [showPayment, setShowPayment] = useState(false);

  const plan = PLANS[selected];

  /* Stage-view signal on mount; the legacy paywall_viewed below still fires
     only when the user opens the payment form. */
  const viewTracked = useRef(false);
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackEvent(FIRST_PARTY_EVENTS.subscriptionViewed, { meta: false });
  }, []);

  const handleSuccess = () => {
    setStep("success");
  };
  const handleSkip = () => {
    trackEvent(FIRST_PARTY_EVENTS.subscriptionSkipped, {
      meta: false,
      metadata: { product_key: selectedProductKey(plan.priceId) },
    });
    setStep("success");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100dvh", padding: "32px 16px 64px" }}
    >
      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <HudLabel tone="signal" style={{ marginBottom: 12 }}>
            Optional membership
          </HudLabel>
          <h1
            className="v2-display"
            style={{ fontSize: "clamp(25px, 6.4vw, 31px)", fontWeight: 550, lineHeight: 1.2, marginBottom: 9 }}
          >
            Keep your FocusRoute system current,{" "}
            <em className="v2-text-signal" style={{ fontStyle: "italic" }}>{displayName}</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.65 }}>
            Membership is optional. Your purchased Brain Profile remains yours, and membership adds retakes, billing access, and future profile updates.
          </p>
        </m.div>

        {/* Plan cards */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PlanCard planKey="annual"  isSelected={selected === "annual"}  onSelect={() => { setSelected("annual");  setShowPayment(false); }} />
          <PlanCard planKey="monthly" isSelected={selected === "monthly"} onSelect={() => { setSelected("monthly"); setShowPayment(false); }} />
        </m.div>

        {/* CTA or Payment form */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="v2-panel" style={{ padding: "22px 22px" }}>

          {!showPayment ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <m.button
                onClick={() => {
                  setShowPayment(true);
                  trackEvent(FIRST_PARTY_EVENTS.paywallViewed, {
                    metadata: {
                      product_key: selectedProductKey(plan.priceId),
                      content_name: "FocusRoute Membership",
                      content_ids: ["membership", plan.priceId],
                      content_type: "subscription",
                      value: plan.amount / 100,
                      currency: "USD",
                    },
                  });
                }}
                whileTap={{ scale: 0.975 }}
                whileHover={{ y: -1 }}
                className="v2-cta"
                style={{
                  width: "100%",
                  minHeight: 58,
                  padding: "18px 24px",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                Start {selected === "annual" ? "Annual" : "Monthly"} Membership — {plan.price}
              </m.button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
                {[
                  { icon: Shield,    label: "SSL Secure" },
                  { icon: RotateCcw, label: "Cancel anytime" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <Icon size={15} color="var(--v2-signal-2)" />
                    <span className="v2-hud" style={{ fontSize: 8.5 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Elements
              stripe={getStripePromise()}
              options={{
                mode: "subscription",
                amount: plan.amount,
                currency: "usd",
                appearance: theme === "light"
                  ? {
                      theme: "stripe",
                      variables: { colorPrimary: "#4655E6", colorBackground: "#FFFFFF", colorText: "#0E1124", colorTextSecondary: "#5A6079", colorTextPlaceholder: "#9AA0B8", colorDanger: "#C53A2E", fontFamily: "inherit", borderRadius: "12px" },
                      rules: {
                        ".Input": { border: "1.5px solid rgba(48,64,150,0.22)", backgroundColor: "#FFFFFF", boxShadow: "0 1px 2px rgba(20,30,90,0.05)" },
                        ".Input:focus": { border: "1.5px solid rgba(70,85,230,0.85)", boxShadow: "0 0 0 3px rgba(70,85,230,0.14)" },
                        ".Tab--selected": { border: "1.5px solid rgba(70,85,230,0.85)", backgroundColor: "rgba(70,85,230,0.08)", color: "#0E1124" },
                      },
                    }
                  : {
                      theme: "night",
                      variables: { colorPrimary: "#9BE8FF", colorBackground: "#10131F", colorText: "#EEF1FF", colorDanger: "#FF8B8B", fontFamily: "inherit", borderRadius: "12px" },
                    },
              }}
            >
              <SubCheckoutForm
                priceId={plan.priceId}
                email={email}
                userName={name}
                quizResultId={quizResultId}
                onSuccess={handleSuccess}
                ctaLabel={`Start ${selected === "annual" ? "Annual" : "Monthly"} Membership — ${plan.price}`}
              />
            </Elements>
          )}
        </m.div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--v2-ink-dim)", textDecoration: "underline", textAlign: "center", padding: "10px 0" }}
        >
          No thanks — take me to my plan
        </button>

      </div>
    </m.div>
  );
}

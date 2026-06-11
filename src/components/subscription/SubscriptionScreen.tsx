"use client";

import { useRef, useState } from "react";
import { m } from "framer-motion";
import { Check, Star, Shield, RotateCcw } from "lucide-react";
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
    if (submitErr) { setError(submitErr.message ?? "Error"); setLoading(false); return; }

    const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({ elements });
    if (pmErr || !paymentMethod) { setError(pmErr?.message ?? "Error creating payment"); setLoading(false); return; }

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

    if (data.error) { setError(data.error); setLoading(false); return; }

    if (data.clientSecret) {
      const { error: confirmErr } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: { return_url: window.location.origin + "/assessment?step=success" },
        redirect: "if_required",
      });
      if (confirmErr) { setError(confirmErr.message ?? "Payment failed"); setLoading(false); return; }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p style={{ fontSize: 13, color: "var(--color-error)", textAlign: "center", background: "var(--color-error-tint)", borderRadius: 12, padding: "9px 12px" }}>{error}</p>}
      <m.button
        type="submit"
        disabled={!stripe || loading}
        whileTap={{ scale: 0.975 }}
        whileHover={loading ? undefined : { y: -1 }}
        style={{
          width: "100%", padding: "18px 24px", borderRadius: 16,
          background: loading ? "var(--color-border)" : "var(--color-accent)",
          color: loading ? "var(--color-text-muted)" : "#ffffff",
          fontSize: 16, fontWeight: 800, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "var(--shadow-btn-accent)",
        }}
      >
        {loading ? "Processing..." : ctaLabel}
      </m.button>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
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
  return (
    <m.button
      onClick={onSelect}
      whileTap={{ scale: 0.982 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        width: "100%", textAlign: "left", borderRadius: 20, overflow: "hidden",
        background: "var(--color-bg-card)",
        boxShadow: isSelected ? "var(--shadow-sel)" : "var(--shadow-card)",
        border: isSelected ? "2px solid var(--color-accent)" : "2px solid transparent",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
          {plan.badge && (
        <div style={{ padding: "8px 20px", background: "var(--color-accent)", color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center", letterSpacing: "0.05em" }}>
          {plan.badge}{plan.savings ? ` — ${plan.savings}` : ""}
        </div>
      )}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              {plan.label}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{planKey === "monthly" ? "/mo" : "/yr"}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>{plan.sub}</p>
            {plan.oldPrice && (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", textDecoration: "line-through", marginTop: 2 }}>{plan.oldPrice}/yr</p>
            )}
          </div>
          <div style={{
            marginTop: 4, width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border-2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isSelected && (
              <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-accent)" }} />
            )}
          </div>
        </div>

        {planKey === "annual" && (
          <ul style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-success-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={10} color="var(--color-success)" />
                </div>
                <span style={{ fontSize: 12, color: "var(--color-text-body)" }}>{f}</span>
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

  const [selected, setSelected] = useState<"annual" | "monthly">("annual");
  const [showPayment, setShowPayment] = useState(false);

  const plan = PLANS[selected];

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
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.25, marginBottom: 8 }}>
            Keep your FocusRoute system current,{" "}
            <span style={{ color: "var(--color-accent)" }}>{displayName}</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>
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
          style={{ background: "var(--color-bg-card)", borderRadius: 22, padding: "22px 22px", boxShadow: "var(--shadow-card)" }}>

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
                style={{
                  width: "100%", padding: "18px 24px", borderRadius: 16,
                  background: "var(--color-accent)", color: "#ffffff",
                  fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer",
                  boxShadow: "var(--shadow-btn-accent)",
                }}
              >
                Start {selected === "annual" ? "Annual" : "Monthly"} Membership — {plan.price}
              </m.button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
                {[
                  { icon: Shield,    label: "SSL Secure" },
                  { icon: RotateCcw, label: "Cancel anytime" },
                  { icon: Star,      label: "4.9 / 5" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <Icon size={16} color={label === "4.9 / 5" ? "var(--color-warning)" : "var(--color-primary)"} />
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{label}</span>
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
                appearance: {
                  theme: "flat",
                  variables: { colorPrimary: "var(--color-accent)", colorBackground: "var(--color-bg-card)", colorText: "var(--color-text)", colorDanger: "var(--color-error)", fontFamily: "inherit", borderRadius: "12px" },
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
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-muted)", textDecoration: "underline", textAlign: "center", padding: "4px 0" }}
        >
          No thanks, skip this step
        </button>

      </div>
    </m.div>
  );
}

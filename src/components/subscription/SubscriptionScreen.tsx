"use client";

import { useState } from "react";
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
import { saveSession } from "@/lib/session";
import { safeName } from "@/lib/personalization";

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return _stripePromise;
}

const PLANS = {
  annual: {
    priceId:    process.env.NEXT_PUBLIC_PRICE_ANNUAL!,
    label:      "Annual Plan",
    price:      "$119",
    sub:        "~$9.92/mo · billed once a year",
    oldPrice:   "$228",
    savings:    "Save 48%",
    badge:      "⭐ MOST POPULAR",
    highlight:  true,
  },
  monthly: {
    priceId:    process.env.NEXT_PUBLIC_PRICE_MONTHLY!,
    label:      "Monthly Plan",
    price:      "$19",
    sub:        "per month · cancel anytime",
    oldPrice:   null,
    savings:    null,
    badge:      null,
    highlight:  false,
  },
};

const FEATURES = [
  "Continuous access to your ADHD report",
  "Monthly check-ins and progress tracking",
  "Updated strategies and content",
  "Priority support",
];

/* Checkout form for subscriptions */
function SubCheckoutForm({ priceId, email, onSuccess }: { priceId: string; email: string; onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) { setError(submitErr.message ?? "Error"); setLoading(false); return; }

    const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({ elements });
    if (pmErr || !paymentMethod) { setError(pmErr?.message ?? "Error creating payment"); setLoading(false); return; }

    const res  = await fetch("/api/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, email, paymentMethodId: paymentMethod.id }),
    });
    const data = await res.json();

    if (data.error) { setError(data.error); setLoading(false); return; }

    if (data.clientSecret) {
      const { error: confirmErr } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: { return_url: window.location.origin + "/?step=success" },
        redirect: "if_required",
      });
      if (confirmErr) { setError(confirmErr.message ?? "Payment failed"); setLoading(false); return; }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p style={{ fontSize: 13, color: "#E87450", textAlign: "center" }}>{error}</p>}
      <m.button
        type="submit"
        disabled={!stripe || loading}
        animate={loading ? {} : { scale: [1, 1.015, 1], transition: { repeat: Infinity, duration: 2.6, ease: "easeInOut" } }}
        style={{
          width: "100%", padding: "18px 24px", borderRadius: 16,
          background: loading ? "var(--color-border)" : "var(--color-primary)",
          color: loading ? "var(--color-text-muted)" : "#ffffff",
          fontSize: 16, fontWeight: 800, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "var(--shadow-btn-primary)",
        }}
      >
        {loading ? "Processing..." : "Start my plan →"}
      </m.button>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
        Cancel anytime · No hidden fees
      </p>
    </form>
  );
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
        border: isSelected ? "2px solid var(--color-primary)" : "2px solid transparent",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {plan.badge && (
        <div style={{ padding: "8px 20px", background: "var(--color-primary)", color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center", letterSpacing: "0.05em" }}>
          {plan.badge} — SAVE 48%
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
            border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border-2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isSelected && (
              <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)" }} />
            )}
          </div>
        </div>

        {planKey === "annual" && (
          <ul style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={10} color="var(--color-primary)" />
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
  const { name, email, setStep } = useQuizStore();
  const displayName = safeName(name, "you");

  const [selected, setSelected] = useState<"annual" | "monthly">("annual");
  const [showPayment, setShowPayment] = useState(false);

  const plan = PLANS[selected];

  const handleSuccess = () => {
    const { email: e, name: n, answers } = useQuizStore.getState();
    saveSession({
      email: e,
      name: n,
      planType: selected === "annual" ? "annual" : "monthly",
      purchasedAt: new Date().toISOString(),
      answers,
    });
    setStep("success");
  };
  const handleSkip = () => setStep("success");

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh", padding: "32px 16px 64px" }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.25, marginBottom: 8 }}>
            Keep your momentum,{" "}
            <span style={{ color: "var(--color-primary)" }}>{displayName}</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>
            Lock in continuous access with monthly check-ins, updated strategies, and priority support — so you never lose progress.
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
                onClick={() => setShowPayment(true)}
                animate={{ scale: [1, 1.016, 1], transition: { repeat: Infinity, duration: 2.6, ease: "easeInOut" } }}
                style={{
                  width: "100%", padding: "18px 24px", borderRadius: 16,
                  background: "var(--color-primary)", color: "#ffffff",
                  fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer",
                  boxShadow: "var(--shadow-btn-primary)",
                }}
              >
                Start {selected === "annual" ? "Annual" : "Monthly"} Plan — {plan.price}
              </m.button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
                {[
                  { icon: Shield,    label: "SSL Secure" },
                  { icon: RotateCcw, label: "Cancel anytime" },
                  { icon: Star,      label: "4.9 / 5" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <Icon size={16} color="var(--color-primary)" />
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
                amount: selected === "annual" ? 11900 : 1900,
                currency: "usd",
                appearance: {
                  theme: "flat",
                  variables: { colorPrimary: "#4A7FA5", colorBackground: "var(--color-bg-card)", colorText: "#1C1A2E", colorDanger: "#E87450", fontFamily: "inherit", borderRadius: "12px" },
                },
              }}
            >
              <SubCheckoutForm priceId={plan.priceId} email={email} onSuccess={handleSuccess} />
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

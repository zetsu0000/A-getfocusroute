"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js/pure";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CheckCircle2, Clock, Zap, Calendar, Target } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { BRAIN_OS } from "@/lib/positioning";

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return _stripePromise;
}
const PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ROADMAP!;

/* 15-minute countdown */
function useTimer(initial = 900) {
  const [secs, setSecs] = useState(initial);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  const expired = secs === 0;
  return { display: `${m}:${s}`, expired };
}

/* Checkout form */
function UpsellCheckoutForm({ onSuccess, onDecline }: { onSuccess: () => void; onDecline: () => void }) {
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

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/?step=subscription" },
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message ?? "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p style={{ fontSize: 13, color: "#E87450", textAlign: "center" }}>{error}</p>}

      <m.button
        type="submit"
        disabled={!stripe || loading}
        animate={loading ? {} : { scale: [1, 1.015, 1], transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" } }}
        style={{
          width: "100%", padding: "18px 24px", borderRadius: 16,
          background: loading ? "var(--color-border)" : "var(--color-accent)",
          color: loading ? "var(--color-text-muted)" : "#ffffff",
          fontSize: 16, fontWeight: 800, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "var(--shadow-btn-accent)",
        }}
      >
        {loading ? "Processing..." : `Yes! Add the ${BRAIN_OS.protocol} — ${BRAIN_OS.price.upsell}`}
      </m.button>

      <button
        type="button"
        onClick={onDecline}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-muted)", textDecoration: "underline", padding: "4px 0" }}
      >
        No thanks, I&apos;ll figure it out on my own
      </button>
    </form>
  );
}

/* Main UpsellScreen */
export function UpsellScreen() {
  const { name, email, setStep } = useQuizStore();
  const { display, expired } = useTimer(900);
  const displayName = name || "you";

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: PRICE_ID, email }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.clientSecret) setClientSecret(data.clientSecret); })
      .finally(() => setLoadingSecret(false));
  }, [email]);

  const handleSuccess = () => setStep("subscription");
  const handleDecline = () => setStep("subscription");

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh", padding: "0 0 56px" }}
    >
      {/* Timer bar */}
      <div style={{
        background: expired ? "var(--color-border)" : "linear-gradient(90deg, #E87450, #CC5C3A)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        <Clock size={16} color="white" />
        <p style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
          {expired
            ? "Offer expired — still available at full price"
            : `Special offer expires in ${display} — one-time opportunity`}
        </p>
      </div>

      <div style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ background: "var(--color-primary-tint)", borderRadius: 8, padding: "4px 10px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Special One-Time Offer
              </span>
            </div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.25, marginBottom: 10 }}>
            {displayName}, you just mapped your brain.{" "}
            <span style={{ color: "var(--color-accent)" }}>Now let&apos;s fix it.</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>
            Your {BRAIN_OS.assessment} revealed your specific ADHD patterns. The {BRAIN_OS.protocol} gives you the exact daily actions to rewire those patterns — personalized to your subtype.
          </p>
        </m.div>

        {/* What's inside */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
          style={{ background: "var(--color-bg-card)", borderRadius: 22, padding: "20px 22px", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            What&apos;s inside the {BRAIN_OS.protocol}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: Calendar, title: "Day-by-day action plan", desc: "28 structured daily actions matched to your ADHD subtype." },
              { icon: Target,   title: "Symptom-specific strategies", desc: "Procrastination, focus, overwhelm — addressed individually." },
              { icon: Zap,      title: "Executive function tools", desc: "Body-doubling, time-boxing, dopamine stacking — the ones that actually work." },
              { icon: CheckCircle2, title: "Weekly milestone check-ins", desc: "Track real progress with your personalized metrics." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "var(--color-primary-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={15} color="var(--color-primary)" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </m.div>

        {/* Price anchor */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: "var(--color-bg-card)", borderRadius: 22, padding: "18px 20px", boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{BRAIN_OS.protocol}</p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>One-time purchase · Instant access</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", textDecoration: "line-through" }}>{BRAIN_OS.price.upsellAnchor}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-accent)", lineHeight: 1 }}>{BRAIN_OS.price.upsell}</p>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--color-border)", margin: "14px 0" }} />

          {loadingSecret ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
              Loading secure payment...
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: { colorPrimary: "#4A7FA5", colorBackground: "var(--color-bg-card)", colorText: "#1C1A2E", colorDanger: "#E87450", fontFamily: "inherit", borderRadius: "12px" },
                },
              }}
            >
              <UpsellCheckoutForm onSuccess={handleSuccess} onDecline={handleDecline} />
            </Elements>
          ) : (
            <p style={{ fontSize: 13, color: "#E87450", textAlign: "center" }}>Could not load payment. Please refresh.</p>
          )}
        </m.div>

        {/* Social proof */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
          style={{ background: "var(--color-bg-card)", borderRadius: 22, padding: "20px 22px", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--color-text-body)", lineHeight: 1.7, marginBottom: 8 }}>
            &quot;You have to take this quiz. The report literally read my mind and explained exactly why I procrastinate the way I do. It proved I&apos;m not just lazy, and the 28-day plan is the only thing that has actually worked for my brain.&quot;
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>— Sarah M., verified customer</p>
        </m.div>

      </div>
    </m.div>
  );
}

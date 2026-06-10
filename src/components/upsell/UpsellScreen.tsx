"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { m } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js/pure";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CheckCircle2, Zap, Calendar, Target } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { BRAIN_OS } from "@/lib/positioning";
import {
  createAnalyticsEventId,
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
const PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ROADMAP!;

const upsellStripeAppearance = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "var(--color-accent)",
    colorBackground: "var(--color-bg-card)",
    colorText: "var(--color-text)",
    colorDanger: "var(--color-error)",
    fontFamily: "inherit",
    borderRadius: "12px",
  },
};

function UpsellStripeElements({
  clientSecret,
  onSuccess,
  onDecline,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onDecline: () => void;
}) {
  const options = useMemo(
    () => ({ clientSecret, appearance: upsellStripeAppearance }),
    [clientSecret],
  );

  return (
    <Elements key={clientSecret} stripe={getStripePromise()} options={options}>
      <UpsellCheckoutForm onSuccess={onSuccess} onDecline={onDecline} />
    </Elements>
  );
}

/* Checkout form */
function UpsellCheckoutForm({ onSuccess, onDecline }: { onSuccess: () => void; onDecline: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const checkoutTracked = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    if (!checkoutTracked.current) {
      checkoutTracked.current = true;
      trackEvent(FIRST_PARTY_EVENTS.checkoutIntent, {
        eventId: getOrCreateActionEventId("upsell_checkout_intent", "initiate_checkout"),
        metadata: {
          product_key: "roadmap_28_day",
          content_name: "FocusRoute 28-Day Protocol",
          content_ids: ["roadmap_28_day", PRICE_ID],
          content_type: "product",
          num_items: 1,
          value: BRAIN_OS.price.upsellValue,
          currency: "USD",
        },
      });
    }

    const { error: submitErr } = await elements.submit();
    if (submitErr) { setError(submitErr.message ?? "Error"); setLoading(false); return; }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/assessment?step=subscription" },
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
        {loading ? "Processing..." : `Add the ${BRAIN_OS.protocol} — ${BRAIN_OS.price.upsell}`}
      </m.button>

      <button
        type="button"
        onClick={onDecline}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-muted)", textDecoration: "underline", padding: "4px 0" }}
      >
        Skip for now
      </button>
    </form>
  );
}

/* Main UpsellScreen */
export function UpsellScreen() {
  const { name, email, setStep, quizResultId } = useQuizStore();
  const displayName = name || "you";

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);

  useEffect(() => {
    trackEvent(FIRST_PARTY_EVENTS.paywallViewed, {
      metadata: {
        product_key: "roadmap_28_day",
        content_name: "FocusRoute 28-Day Protocol",
        content_ids: ["roadmap_28_day", PRICE_ID],
        content_type: "product",
        value: BRAIN_OS.price.upsellValue,
        currency: "USD",
      },
    });

    const analyticsEventId = createAnalyticsEventId("initiate_checkout");
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: PRICE_ID,
        email,
        funnel_step: "upsell",
        quiz_result_id: quizResultId ?? "",
        user_name: name,
        analytics_event_id: analyticsEventId,
        analytics_context: getAnalyticsContext(),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      })
      .finally(() => setLoadingSecret(false));
  }, [email, name, quizResultId]);

  const handleSuccess = () => setStep("subscription");
  const handleDecline = () => setStep("subscription");

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh", padding: "0 0 56px" }}
    >
      {/* Offer context */}
      <div style={{
        background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-dark))",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap",
      }}>
        <Target size={16} color="white" />
        <p style={{ fontSize: 13, fontWeight: 700, color: "white", flexShrink: 1, textAlign: "center" }}>
          Optional protocol expansion · one-time purchase · instant access
        </p>
      </div>

      <div style={{ padding: "28px 16px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ background: "var(--color-primary-tint)", borderRadius: 8, padding: "4px 10px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Protocol add-on
              </span>
            </div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.25, marginBottom: 10 }}>
            {displayName}, you just mapped your brain.{" "}
            <span style={{ color: "var(--color-accent)" }}>Turn insight into a daily system.</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>
            Your {BRAIN_OS.assessment} mapped your signature pattern. The {BRAIN_OS.protocol} gives you practical daily actions personalized to that map.
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
              { icon: Calendar, title: "Day-by-day action plan", desc: "28 structured daily actions matched to your signature profile." },
              { icon: Target,   title: "Pattern-specific strategies", desc: "Task initiation, sustained focus, and reset planning covered step by step." },
              { icon: Zap,      title: "Executive function tools", desc: "Time-boxing, reset cues, and attention anchors selected for your profile." },
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
            <UpsellStripeElements
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onDecline={handleDecline}
            />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-error)", textAlign: "center" }}>Could not load payment. Please refresh.</p>
          )}
        </m.div>

      </div>
    </m.div>
  );
}

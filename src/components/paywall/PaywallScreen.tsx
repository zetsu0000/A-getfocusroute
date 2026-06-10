"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Shield, Lock, Check, BadgeCheck, CreditCard } from "lucide-react";
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
import { getSignatureFromAnswers, echoSentence } from "@/lib/signature";
import { SignatureRevealCard } from "@/components/signature/SignatureRevealCard";
import {
  createAnalyticsEventId,
  getAnalyticsContext,
  getOrCreateActionEventId,
  trackEvent,
} from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

// Lazy singleton - loadStripe (and the Stripe.js download) only fires
// when the PaywallScreen first renders, not when the chunk is prefetched.
let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return _stripePromise;
}
const PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ASSESSMENT!;

const stripeAppearance = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "var(--color-accent)",
    colorBackground: "var(--color-bg-card)",
    colorText: "var(--color-text)",
    colorTextSecondary: "var(--color-text-body)",
    colorTextPlaceholder: "var(--color-text-soft)",
    colorDanger: "var(--color-error)",
    fontFamily: "inherit",
    fontSizeBase: "15px",
    spacingUnit: "5px",
    borderRadius: "12px",
    gridColumnSpacing: "12px",
    gridRowSpacing: "12px",
  },
  rules: {
    ".Input": {
      border: "1.5px solid var(--color-border)",
      backgroundColor: "var(--color-bg-card-2)",
      padding: "12px 14px",
      fontSize: "15px",
      boxShadow: "none",
      transition: "border-color 0.15s",
    },
    ".Input:focus": {
      border: "1.5px solid var(--color-accent)",
      boxShadow: "0 0 0 3px var(--color-primary-ring)",
      outline: "none",
    },
    ".Label": {
      fontSize: "12px",
      fontWeight: "600",
      color: "var(--color-text-body)",
      marginBottom: "5px",
    },
    ".Tab": {
      border: "1.5px solid var(--color-border)",
      backgroundColor: "var(--color-bg-card-2)",
      padding: "10px 16px",
      fontWeight: "600",
    },
    ".Tab--selected": {
      border: "1.5px solid var(--color-accent)",
      backgroundColor: "var(--color-accent-tint)",
      color: "var(--color-accent)",
      boxShadow: "none",
    },
    ".Error": {
      color: "var(--color-error)",
      fontSize: "12px",
    },
  },
};

function revealsFor(planFocus: string): string[] {
  return [
    `A plan focused on ${planFocus}`,
    "Your top focus friction points, named in plain language",
    "Your first next step — what to try when starting feels heavy",
    "Your Executive Function Radar — where focus holds, where it slips",
    "A simple way to explain your pattern to someone",
  ];
}

/* Locked result card */
function LockedCard() {
  const answers = useQuizStore((s) => s.answers);
  const signature = getSignatureFromAnswers(answers);
  const reduceMotion = useReducedMotion();
  const profileBandBySignature: Record<string, { label: string; pct: number; color: string; bg: string; shadow: string }> = {
    Sprinter: { label: "Fast-cycle",     pct: 68, color: "var(--color-sig-sprinter)",  bg: "var(--color-sig-sprinter-tint)",  shadow: "var(--shadow-sig-sprinter)"  },
    Archivist: { label: "Detail-led",   pct: 46, color: "var(--color-sig-archivist)", bg: "var(--color-sig-archivist-tint)", shadow: "var(--shadow-sig-archivist)" },
    Spark: { label: "Novelty-led",      pct: 76, color: "var(--color-sig-spark)",     bg: "var(--color-sig-spark-tint)",     shadow: "var(--shadow-sig-spark)"     },
    Reactor: { label: "Adaptive",       pct: 58, color: "var(--color-sig-reactor)",   bg: "var(--color-sig-reactor-tint)",   shadow: "var(--shadow-sig-reactor)"   },
    Drifter: { label: "Anchor-seeking", pct: 39, color: "var(--color-sig-drifter)",   bg: "var(--color-sig-drifter-tint)",   shadow: "var(--shadow-sig-drifter)"   },
  };
  const profileBand = profileBandBySignature[signature.signature] ?? profileBandBySignature.Drifter;

  const rows = [
    { label: "Your pressure response pattern", value: "Preview hidden" },
    { label: "Your best starting conditions", value: "Preview hidden" },
    { label: "Your recovery rhythm", value: "Preview hidden" },
    { label: "Your explain-it-to-someone script", value: "Preview hidden" },
    { label: "Your next-step protocol recommendation", value: "Preview hidden" },
  ];

  const curiosityBullets = [
    "What triggers your strongest focus",
    "Where pressure starts to distort planning",
    "How you recover momentum after overload",
  ];

  return (
    <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-bg-card)", boxShadow: "var(--shadow-card-strong)", border: "1px solid var(--color-border-2)" }}>
      <SignatureRevealCard
        signatureKey={signature.signature}
        signatureName={signature.signature}
        signatureEssence={signature.title}
        signatureSummary={signature.preview}
        variant="paywall"
      />

      <div style={{ padding: "16px 18px 18px" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 12 }}>
          {signature.frictionLine} It&apos;s a focus pattern, not a diagnosis.
        </p>

        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {curiosityBullets.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-cognitive-tint)", color: "var(--color-cognitive)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={11} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text)", fontWeight: 750, lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "linear-gradient(to right, var(--color-primary-tint), var(--color-signal-tint), var(--color-cognitive-tint))", position: "relative", marginBottom: 16 }}>
          <m.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={reduceMotion ? undefined : { delay: 0.35, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", left: `${profileBand.pct}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "var(--color-bg-card)", border: `3px solid ${profileBand.color}`, boxShadow: profileBand.shadow }}
          />
        </div>

        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)", background: "linear-gradient(180deg,var(--color-bg-card),var(--color-bg-card-2))" }}>
          <div style={{ userSelect: "none", pointerEvents: "none", display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
          {rows.map(({ label }) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 74px", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.66)", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: 12, color: "var(--color-text)", fontWeight: 750, overflowWrap: "break-word" }}>{label}</span>
              <span aria-hidden="true" style={{ height: 8, borderRadius: "var(--radius-pill)", background: "linear-gradient(90deg,var(--color-border),var(--color-primary-ring))" }} />
            </div>
          ))}
          </div>

          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(180deg,rgba(255,255,255,0.54),rgba(255,255,255,0.84))", backdropFilter: "blur(2px)" }}>
            <div
              style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-btn-accent)" }}
            >
              <Lock size={19} color="white" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 850, color: "var(--color-text)", textAlign: "center", lineHeight: 1.32 }}>
              Unlock to see<br />the full pattern map
            </p>
          </div>
        </div>

        <p style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.58 }}>
          Your full profile explains what this pattern means and how to work with it instead of fighting it.
        </p>
      </div>
    </div>
  );
}

/* Stripe checkout form */
function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const reduceMotion = useReducedMotion();
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
        eventId: getOrCreateActionEventId("paywall_checkout_intent", "initiate_checkout"),
        metadata: {
          product_key: "brain_profile",
          content_name: "FocusRoute Brain Profile",
          content_ids: ["brain_profile", PRICE_ID],
          content_type: "product",
          num_items: 1,
          value: BRAIN_OS.price.paywallValue,
          currency: "USD",
        },
      });
    }

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message ?? "Error");
      trackEvent(FIRST_PARTY_EVENTS.paymentError, {
        meta: false,
        metadata: { product_key: "brain_profile", stage: "element_submit" },
      });
      setLoading(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/assessment?step=upsell" },
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message ?? "Payment failed");
      trackEvent(FIRST_PARTY_EVENTS.paymentError, {
        meta: false,
        metadata: { product_key: "brain_profile", stage: "confirm_payment" },
      });
      setLoading(false);
    }
    else            { onSuccess(); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        onReady={() => {
          trackEvent(FIRST_PARTY_EVENTS.paymentElementLoaded, {
            meta: false,
            metadata: { product_key: "brain_profile" },
          });
        }}
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
          fields: { billingDetails: { name: "auto" } },
        }}
      />

      {error && (
        <m.p
          initial={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        style={{ marginTop: 12, fontSize: 13, color: "var(--color-error)", textAlign: "center", background: "var(--color-error-tint)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        >
          <AlertCircle size={15} /> {error}
        </m.p>
      )}

      <m.button
        type="submit"
        disabled={!stripe || loading}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        whileHover={reduceMotion || loading ? undefined : { y: -1 }}
        style={{
          marginTop: 16, width: "100%", padding: "18px 24px", borderRadius: "var(--radius-md)",
          background: loading
            ? "var(--color-border)"
            : "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))",
          color: loading ? "var(--color-text-muted)" : "#fff",
          fontSize: 17, fontWeight: 800, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: loading ? "none" : "0 12px 28px rgba(20,17,31,0.2)",
        }}
      >
        {loading ? (
          <>
            <m.span
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : { duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--color-text-muted)", borderTopColor: "transparent", borderRadius: "50%" }}
            />
            Processing...
          </>
        ) : (
          <>
            <Lock size={17} color="white" strokeWidth={2.5} />
            Unlock My Full Plan ({BRAIN_OS.price.paywall})
          </>
        )}
      </m.button>

      {/* Trust row */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        {[
          { icon: Shield,    label: "256-bit SSL" },
          { icon: CreditCard, label: "Secure payment" },
          { icon: BadgeCheck, label: "Instant access" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon size={13} color="var(--color-text-muted)" />
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
        One-time payment / Instant access in your account / 7-day refund
      </p>
    </form>
  );
}

function PaywallStripeElements({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const options = useMemo(
    () => ({ clientSecret, appearance: stripeAppearance }),
    [clientSecret],
  );

  return (
    <Elements key={clientSecret} stripe={getStripePromise()} options={options}>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  );
}

/* Loading skeleton */
function PaymentSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[56, 56, 50].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: "var(--radius-sm)", background: "var(--color-border)" }} />
      ))}
      <div style={{ height: 58, borderRadius: "var(--radius-md)", background: "var(--color-border)", marginTop: 4 }} />
    </div>
  );
}

/* Main PaywallScreen */
export function PaywallScreen() {
  const { name, email, setStep, quizResultId, answers } = useQuizStore();
  const displayName = safeName(name, "Your");
  const signature = getSignatureFromAnswers(answers);
  const echo = echoSentence(answers);

  const handlePaywallSuccess = () => {
    setStep("upsell");
  };

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);

  useEffect(() => {
    trackEvent(FIRST_PARTY_EVENTS.paywallViewed, {
      metadata: {
        product_key: "brain_profile",
        content_name: "FocusRoute Brain Profile",
        content_ids: ["brain_profile", PRICE_ID],
        content_type: "product",
        value: BRAIN_OS.price.paywallValue,
        currency: "USD",
        signature_key: signature.signature,
      },
    });
  }, [signature.signature]);

  useEffect(() => {
    const analyticsEventId = createAnalyticsEventId("initiate_checkout");
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: PRICE_ID,
        email,
        funnel_step: "paywall",
        quiz_result_id: quizResultId ?? "",
        user_name: name,
        analytics_event_id: analyticsEventId,
        analytics_context: getAnalyticsContext(),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) {
          setClientSecret(d.clientSecret);
        }
      })
      .finally(() => setLoadingSecret(false));
  }, [email, name, quizResultId]);

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }}>
      <div style={{ padding: "18px 14px 56px", overflowX: "hidden" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-2)",
            }}
          >
            {["Private results", "Not a diagnosis", "Instant access"].map((item) => (
              <span key={item} style={{ fontSize: 12, color: "var(--color-text-body)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <BadgeCheck size={13} color="var(--color-text-muted)" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "18px 20px 14px" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 8 }}>
                Your pattern: {signature.title}
              </p>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.22, letterSpacing: "-0.02em" }}>
                {displayName === "Your" ? "Now turn this into a plan built for you." : `${displayName}, now turn this into a plan built for you.`}
              </h1>
              <p style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.62 }}>
                {echo ? `${echo} ` : ""}Your full plan focuses on {signature.planFocus}.
              </p>
            </div>

            <div style={{ padding: "0 20px 18px" }}>
              <LockedCard />
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-muted)", fontWeight: 700 }}>
                  Your full plan
                </p>
                <p style={{ fontSize: 13, color: "var(--color-text-body)", marginTop: 2 }}>
                  Built from your answers, not a generic guide
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", textDecoration: "line-through" }}>
                  {BRAIN_OS.price.paywallAnchor}
                </p>
                <p style={{ fontSize: 34, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {BRAIN_OS.price.paywall}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
              Why {BRAIN_OS.price.paywall} instead of {BRAIN_OS.price.paywallAnchor}? Finishing the assessment did the mapping work — so you get completer pricing for this results session.
            </p>

            <p style={{ fontSize: 12, fontWeight: 850, color: "var(--color-text)", marginBottom: 10 }}>
              What&apos;s in your full plan
            </p>
            <div style={{ marginBottom: 12, display: "grid", gap: 8 }}>
              {revealsFor(signature.planFocus).map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "var(--radius-pill)", background: "var(--color-signal-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={11} color="var(--color-signal)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.45 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12, marginTop: 4 }}>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <BadgeCheck size={14} color="var(--color-warning)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary-dark)" }}>{BRAIN_OS.clinicalContrastShort}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                {BRAIN_OS.guaranteeTitle}. If it doesn&apos;t feel accurate, request a full refund within 7 days.
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5, marginTop: 8 }}>
                FocusRoute is educational self-understanding and productivity support. It is not a diagnosis or medical treatment.
              </p>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { q: "Is this just another quiz?", a: "No — your plan is built from your answers, not generic tips." },
                { q: "Is this a diagnosis?", a: "No. It's a focus pattern and a practical plan, not a medical assessment." },
                { q: "What do I actually get?", a: "Your full pattern breakdown, your radar map, and your first next steps — instantly in your account." },
                { q: "Will this be too much work?", a: "No — plain language and small steps, built for short attention." },
                { q: "What if it doesn't fit?", a: "7-day refund. If it's not you, email us — no questions." },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", marginBottom: 2 }}>{q}</p>
                  <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>{a}</p>
                </div>
              ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              padding: "16px 18px",
            }}
          >
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-muted)", fontWeight: 700, marginBottom: 10 }}>
              After you pay
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                "Your full plan unlocks in your account the moment you pay.",
                "We email you a copy, so it's easy to come back to.",
                "Start with one short first step — no overwhelm.",
              ].map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "var(--radius-pill)", background: "var(--color-signal-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={11} color="var(--color-signal)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.45 }}>{line}</span>
                </div>
              ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.115 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              padding: "16px 18px",
            }}
          >
            <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--color-text-body)", lineHeight: 1.7, marginBottom: 8 }}>
              &quot;The profile language felt uncannily accurate. For the first time, I had a step-by-step system that matched how I actually work.&quot;
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>— Sarah M., verified customer</p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              padding: "18px",
            }}
          >
            <AnimatePresence mode="wait">
              {loadingSecret ? (
                <m.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PaymentSkeleton />
                </m.div>
              ) : clientSecret ? (
                <m.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
                  <PaywallStripeElements
                    clientSecret={clientSecret}
                    onSuccess={handlePaywallSuccess}
                  />
                </m.div>
              ) : (
                <m.p key="error" style={{ fontSize: 13, color: "var(--color-accent-dark)", textAlign: "center", padding: "16px 0" }}>
                  Failed to load payment. Please refresh the page.
                </m.p>
              )}
            </AnimatePresence>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            style={{
              background: "var(--color-bg-card)",
              borderRadius: 18,
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Shield size={16} color="var(--color-primary)" />
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.45 }}>
              Secure checkout via Stripe / encrypted payment / instant access to your plan
            </p>
          </m.div>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)", marginTop: 6, lineHeight: 2 }}>
            <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
            {" / "}
            <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
            {" / "}
            <a href="/refund-policy" style={{ color: "inherit", textDecoration: "none" }}>Refunds</a>
            {" / "}
            <a href="/disclaimer" style={{ color: "inherit", textDecoration: "none" }}>Disclaimer</a>
          </p>
        </div>
      </div>
    </m.div>
  );
}

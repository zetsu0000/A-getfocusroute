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
import { getSignatureIdentity } from "@/lib/signature-identity";
import { SigilArtifact } from "@/components/v2/SigilArtifact";
import { HudLabel } from "@/components/v2/primitives";
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

/* V2 dark-vault Stripe appearance. The Payment Element renders in an iframe,
   so values must be literal colors (CSS variables don't cross the boundary). */
const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#9BE8FF",
    colorBackground: "#10131F",
    colorText: "#EEF1FF",
    colorTextSecondary: "#A9B0CC",
    colorTextPlaceholder: "#5A6079",
    colorDanger: "#FF8B8B",
    fontFamily: "inherit",
    fontSizeBase: "15px",
    spacingUnit: "5px",
    borderRadius: "12px",
    gridColumnSpacing: "12px",
    gridRowSpacing: "12px",
  },
  rules: {
    ".Input": {
      border: "1.5px solid rgba(163,178,255,0.18)",
      backgroundColor: "#0B0E18",
      padding: "12px 14px",
      fontSize: "15px",
      boxShadow: "none",
      transition: "border-color 0.15s",
    },
    ".Input:focus": {
      border: "1.5px solid rgba(155,232,255,0.7)",
      boxShadow: "0 0 0 3px rgba(124,138,255,0.18)",
      outline: "none",
    },
    ".Label": {
      fontSize: "12px",
      fontWeight: "600",
      color: "#A9B0CC",
      marginBottom: "5px",
    },
    ".Tab": {
      border: "1.5px solid rgba(163,178,255,0.18)",
      backgroundColor: "#0B0E18",
      padding: "10px 16px",
      fontWeight: "600",
    },
    ".Tab--selected": {
      border: "1.5px solid rgba(155,232,255,0.7)",
      backgroundColor: "rgba(124,138,255,0.12)",
      color: "#EEF1FF",
      boxShadow: "none",
    },
    ".Error": {
      color: "#FF8B8B",
      fontSize: "12px",
    },
  },
};

function revealsFor(planFocus: string): string[] {
  return [
    `A plan focused on ${planFocus}`,
    "Your top focus friction points, named in plain language",
    "Your first next step — what to try when starting feels heavy",
    "A map of where your focus holds and where it slips (your Executive Function Radar)",
    "A simple way to explain your pattern to someone",
  ];
}

/* The three things the buyer gets, in plain words — shown before any
   branded terms so the first paywall screen answers "what am I buying?" */
function plainDeliverables(planFocus: string): string[] {
  return [
    `Your full pattern breakdown — and a plan for ${planFocus}`,
    "Your first next step, small enough to try today",
    "Instant access in your account, kept there for you",
  ];
}

function scrollToCheckout() {
  document.getElementById("paywall-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Locked result card — the artifact under glass */
function LockedCard() {
  const answers = useQuizStore((s) => s.answers);
  const signature = getSignatureFromAnswers(answers);
  const identity = getSignatureIdentity(signature.signature);
  const reduceMotion = useReducedMotion();
  const profileBandBySignature: Record<string, { label: string; pct: number }> = {
    Sprinter:  { label: "Fast-cycle",     pct: 68 },
    Archivist: { label: "Detail-led",     pct: 46 },
    Spark:     { label: "Novelty-led",    pct: 76 },
    Reactor:   { label: "Adaptive",       pct: 58 },
    Drifter:   { label: "Anchor-seeking", pct: 39 },
  };
  const profileBand = profileBandBySignature[signature.signature] ?? profileBandBySignature.Drifter;

  /* First locked row names the user's own pattern; the rest stay generic. */
  const lockedPatternRow: Record<string, string> = {
    Sprinter: "Your pressure-to-momentum pattern",
    Archivist: "Your overload threshold pattern",
    Spark: "Your novelty-to-follow-through pattern",
    Reactor: "Your mood-to-focus pattern",
    Drifter: "Your attention anchor pattern",
  };
  const rows = [
    { label: lockedPatternRow[signature.signature] ?? "Your pressure response pattern", value: "Preview hidden" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SigilArtifact
        signatureKey={signature.signature}
        signatureName={signature.signature}
        essence={signature.title}
        summary={signature.preview}
        variant="paywall"
      />

      <div>
        <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.65, marginBottom: 14 }}>
          {signature.frictionLine} It&apos;s a focus pattern, not a diagnosis.
        </p>

        <div style={{ display: "grid", gap: 9, marginBottom: 16 }}>
          {curiosityBullets.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: `rgba(${identity.accentRgb},0.16)`, border: `1px solid rgba(${identity.accentRgb},0.4)`, color: identity.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={10} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 13, color: "var(--v2-ink)", fontWeight: 700, lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </div>

        {/* profile band */}
        <div
          style={{
            height: 7,
            borderRadius: 999,
            background: "linear-gradient(to right, rgba(155,232,255,0.3), rgba(124,138,255,0.35), rgba(179,155,255,0.3))",
            position: "relative",
            marginBottom: 18,
          }}
        >
          <m.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={reduceMotion ? undefined : { delay: 0.35, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: `${profileBand.pct}%`,
              top: "50%",
              x: "-50%",
              y: "-50%",
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: "#0B0E1A",
              border: `3px solid ${identity.accent}`,
              boxShadow: `0 0 16px rgba(${identity.accentRgb},0.7)`,
            }}
          />
        </div>

        {/* locked dossier rows */}
        <div
          style={{
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(217,188,127,0.22)",
            background: "linear-gradient(180deg, rgba(14,18,32,0.8), rgba(8,10,18,0.9))",
          }}
        >
          {/* gold scanline — the system continuously reading the sealed layer */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "18%",
              background:
                "linear-gradient(to bottom, transparent, rgba(217,188,127,0.10) 45%, rgba(240,220,174,0.16) 50%, rgba(217,188,127,0.10) 55%, transparent)",
              animation: "v2-gold-scan 4.2s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <div style={{ userSelect: "none", pointerEvents: "none", display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
            {rows.map(({ label }) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) 74px",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 13px",
                  borderRadius: 11,
                  background: "rgba(148,163,255,0.05)",
                  border: "1px solid var(--v2-line)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--v2-ink-dim)", fontWeight: 700, overflowWrap: "break-word" }}>{label}</span>
                <span
                  aria-hidden="true"
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "repeating-linear-gradient(90deg, rgba(163,178,255,0.25) 0 6px, rgba(163,178,255,0.08) 6px 12px)",
                  }}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "linear-gradient(180deg, rgba(6,7,13,0.35), rgba(6,7,13,0.78))",
              backdropFilter: "blur(2.5px)",
              WebkitBackdropFilter: "blur(2.5px)",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: "linear-gradient(140deg, rgba(217,188,127,0.3), rgba(168,132,60,0.18))",
                border: "1px solid rgba(217,188,127,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 34px rgba(217,188,127,0.25), inset 0 1px 0 rgba(255,248,226,0.3)",
                animation: "v2-pulse-gold 2.8s ease-out infinite",
              }}
            >
              <Lock size={19} color="var(--v2-gold-bright)" strokeWidth={2.4} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--v2-ink)", textAlign: "center", lineHeight: 1.35 }}>
              Unlock to see<br />the full pattern map
            </p>
          </div>
        </div>

        <p style={{ marginTop: 13, fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>
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
          style={{ marginTop: 12, fontSize: 13, color: "var(--v2-error)", textAlign: "center", background: "rgba(255,139,139,0.1)", border: "1px solid rgba(255,139,139,0.3)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        >
          <AlertCircle size={15} /> {error}
        </m.p>
      )}

      <m.button
        type="submit"
        disabled={!stripe || loading}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        whileHover={reduceMotion || loading ? undefined : { y: -1 }}
        className={loading ? undefined : "v2-cta v2-cta-gold"}
        style={{
          marginTop: 16,
          width: "100%",
          minHeight: 60,
          padding: "18px 24px",
          borderRadius: 999,
          fontSize: 17,
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          ...(loading
            ? {
                background: "rgba(148,163,255,0.06)",
                border: "1px solid var(--v2-line)",
                color: "var(--v2-ink-faint)",
              }
            : {}),
        }}
      >
        {loading ? (
          <>
            <m.span
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : { duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--v2-ink-faint)", borderTopColor: "transparent", borderRadius: "50%" }}
            />
            Processing...
          </>
        ) : (
          <>
            <Lock size={17} strokeWidth={2.5} />
            Unlock My Full Plan ({BRAIN_OS.price.paywall})
          </>
        )}
      </m.button>

      {/* Trust row */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        {[
          { icon: Shield,    label: "256-bit SSL" },
          { icon: CreditCard, label: "Secure payment" },
          { icon: BadgeCheck, label: "Instant access" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon size={13} color="var(--v2-ink-faint)" />
            <span className="v2-hud" style={{ fontSize: 9, letterSpacing: "0.12em" }}>{label}</span>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center" }}>
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
        <div key={i} style={{ height: h, borderRadius: 12, background: "rgba(148,163,255,0.08)", border: "1px solid var(--v2-line)" }} />
      ))}
      <div style={{ height: 58, borderRadius: 999, background: "rgba(217,188,127,0.1)", border: "1px solid rgba(217,188,127,0.25)", marginTop: 4 }} />
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

  /* checkout_section_reached: fires once when the payment section actually
     enters the viewport. This — not paywall_viewed and not
     payment_intent_created (which fires on render) — is the "user got to
     where money moves" signal. */
  const checkoutReachedRef = useRef(false);
  useEffect(() => {
    const el = document.getElementById("paywall-checkout");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || checkoutReachedRef.current) return;
        checkoutReachedRef.current = true;
        trackEvent(FIRST_PARTY_EVENTS.checkoutSectionReached, {
          meta: false,
          metadata: { product_key: "brain_profile" },
        });
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      {/* gold-dusted vault atmosphere */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(80% 50% at 50% 0%, rgba(217,188,127,0.07) 0%, transparent 55%), radial-gradient(70% 45% at 50% 110%, rgba(124,138,255,0.1) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", padding: "20px 14px 56px", overflowX: "hidden" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 999,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
              background: "rgba(10,13,24,0.7)",
              border: "1px solid var(--v2-line)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {["Private results", "Not a diagnosis", "Instant access"].map((item) => (
              <span key={item} style={{ fontSize: 11.5, color: "var(--v2-ink-dim)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <BadgeCheck size={13} color="var(--v2-ink-faint)" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </m.div>

          {/* ── First screen: what you get, what it costs, where to pay.
              The audit's top finding — checkout access was 4-5 screens deep
              on mobile. This block answers everything before any scrolling. */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="v2-panel"
            style={{ padding: "20px 20px 18px", borderColor: "rgba(217,188,127,0.28)" }}
          >
            <HudLabel tone="signal" style={{ marginBottom: 10 }}>
              Your pattern: {signature.title}
            </HudLabel>
            <h1
              className="v2-display"
              style={{ fontSize: "clamp(24px, 6vw, 29px)", fontWeight: 550, lineHeight: 1.2, letterSpacing: "-0.02em" }}
            >
              {displayName === "Your" ? "Now turn this into a plan built for you." : `${displayName}, now turn this into a plan built for you.`}
            </h1>
            <p style={{ marginTop: 9, fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.65 }}>
              {echo ? `${echo} ` : ""}Your full plan focuses on {signature.planFocus}.
            </p>

            <div style={{ marginTop: 14, display: "grid", gap: 9 }}>
              {plainDeliverables(signature.planFocus).map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: "rgba(217,188,127,0.14)", border: "1px solid rgba(217,188,127,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={10} color="var(--v2-gold)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13.5, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="v2-display v2-text-gold" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {BRAIN_OS.price.paywall}
                </span>
                <span style={{ fontSize: 12, color: "var(--v2-ink-ghost)", textDecoration: "line-through" }}>
                  {BRAIN_OS.price.paywallAnchor}
                </span>
                <span className="v2-hud" style={{ fontSize: 9 }}>one-time</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                trackEvent(FIRST_PARTY_EVENTS.checkoutCtaClicked, {
                  meta: false,
                  metadata: { product_key: "brain_profile", cta_location: "paywall_offer_top" },
                });
                scrollToCheckout();
              }}
              className="v2-cta v2-cta-gold"
              style={{ marginTop: 12, width: "100%", minHeight: 56, fontSize: 15.5 }}
            >
              <Lock size={15} strokeWidth={2.5} />
              Unlock My Full Plan ({BRAIN_OS.price.paywall})
            </button>
            <p style={{ marginTop: 9, fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center" }}>
              Instant access in your account / 7-day refund / Not a diagnosis
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="v2-panel"
            style={{ overflow: "hidden", padding: 0 }}
          >
            <div style={{ padding: "18px 18px" }}>
              <LockedCard />
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="v2-panel"
            style={{ padding: "18px 20px", borderColor: "rgba(217,188,127,0.25)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div>
                <HudLabel tone="gold">Your full plan</HudLabel>
                <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", marginTop: 4 }}>
                  Built from your answers, not a generic guide
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: "var(--v2-ink-ghost)", textDecoration: "line-through" }}>
                  {BRAIN_OS.price.paywallAnchor}
                </p>
                <p
                  className="v2-display v2-text-gold"
                  style={{ fontSize: 38, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {BRAIN_OS.price.paywall}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.55, marginBottom: 14 }}>
              Why {BRAIN_OS.price.paywall} instead of {BRAIN_OS.price.paywallAnchor}? Finishing the assessment did the mapping work — so you get completer pricing for this results session.
            </p>

            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--v2-ink)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              What&apos;s in your full plan
            </p>
            <div style={{ marginBottom: 14, display: "grid", gap: 9 }}>
              {revealsFor(signature.planFocus).map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: "rgba(217,188,127,0.14)", border: "1px solid rgba(217,188,127,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={10} color="var(--v2-gold)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--v2-line)", paddingTop: 13, marginTop: 4 }}>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <BadgeCheck size={14} color="var(--v2-gold)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--v2-ink)" }}>{BRAIN_OS.clinicalContrastShort}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.55 }}>
                {BRAIN_OS.guaranteeTitle}. If it doesn&apos;t feel accurate, request a full refund within 7 days.
              </p>
              <p style={{ fontSize: 11, color: "var(--v2-ink-ghost)", lineHeight: 1.55, marginTop: 8 }}>
                FocusRoute is educational self-understanding and productivity support. It is not a diagnosis or medical treatment.
              </p>
            </div>
          </m.div>

          {/* Payment sits directly after the offer — FAQ and proof follow it,
              so checkout is reachable in roughly two screens instead of five. */}
          <m.div
            id="paywall-checkout"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="v2-panel"
            style={{ padding: "18px", borderColor: "rgba(217,188,127,0.3)", scrollMarginTop: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Lock size={13} color="var(--v2-gold)" />
              <HudLabel tone="gold">Secure unlock</HudLabel>
            </div>
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
                <m.p key="error" style={{ fontSize: 13, color: "var(--v2-error)", textAlign: "center", padding: "16px 0" }}>
                  Failed to load payment. Please refresh the page.
                </m.p>
              )}
            </AnimatePresence>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10 }}
            className="v2-panel"
            style={{ padding: "18px 20px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {[
                { q: "Is this just another quiz?", a: "No — your plan is built from your answers, not generic tips." },
                { q: "Is this a diagnosis?", a: "No. It's a focus pattern and a practical plan, not a medical assessment." },
                { q: "What do I actually get?", a: "Your full pattern breakdown, your radar map, and your first next steps — instantly in your account." },
                { q: "Will this be too much work?", a: "No — plain language and small steps, built for short attention." },
                { q: "How long until I see something change?", a: "Your first next step is small enough to try today. The plan works in short steps — you don't have to finish a program before anything shifts." },
                { q: "What if it doesn't fit?", a: "7-day refund. If it's not you, email us — no questions." },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--v2-ink)", marginBottom: 3 }}>{q}</p>
                  <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.55 }}>{a}</p>
                </div>
              ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="v2-panel"
            style={{ padding: "18px 20px" }}
          >
            <HudLabel style={{ marginBottom: 12 }}>After you pay</HudLabel>
            <div style={{ display: "grid", gap: 9 }}>
              {[
                "Your full plan unlocks in your account the moment you pay.",
                "Sign in with the same email anytime — your plan stays saved to it.",
                "Start with one short first step — no overwhelm.",
              ].map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: "rgba(124,138,255,0.12)", border: "1px solid rgba(124,138,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={10} color="var(--v2-signal-2)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>{line}</span>
                </div>
              ))}
            </div>
          </m.div>

          {/* Social proof intentionally lives only at the result→paywall
              decision point (ChartScreen), not here: the paywall is already
              trust-dense and adding a testimonial would push checkout lower.
              The previous hard-coded "verified customer" quote was unverifiable
              and has been removed. */}

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="v2-panel"
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Shield size={16} color="var(--v2-signal-2)" />
            <p style={{ fontSize: 12, color: "var(--v2-ink-dim)", lineHeight: 1.45 }}>
              Secure checkout via Stripe / encrypted payment / instant access to your plan
            </p>
          </m.div>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--v2-ink-ghost)", marginTop: 6, lineHeight: 2 }}>
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

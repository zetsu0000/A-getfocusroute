"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Lock, Check } from "lucide-react";
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
import { SignatureSigil } from "@/components/signature/SignatureSigil";
import { HudLabel } from "@/components/v2/primitives";
import {
  createAnalyticsEventId,
  getAnalyticsContext,
  getOrCreateActionEventId,
  trackEvent,
} from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import {
  NON_DIAGNOSIS_LINE,
  PAYWALL_CHECKOUT_ID,
  PAYWALL_FAQ,
  POST_PAYMENT_EXPECTATION,
  SECURE_PAYMENT_LINE,
  TRUST_LINE_ITEMS,
  paywallDeliverables,
} from "./paywallContent";

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

function scrollToCheckout() {
  document.getElementById(PAYWALL_CHECKOUT_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Compact personalized artifact — a small cue that the plan is built from the
   user's own answers. The full sigil already appeared on the result reveal, so
   here it stays deliberately small: sigil + "Your full pattern map" + a few
   locked rows. No friction paragraph, curiosity bullets, profile band, or
   closing copy — those duplicated the result screen and added height. */
function ArtifactPreview() {
  const answers = useQuizStore((s) => s.answers);
  const signature = getSignatureFromAnswers(answers);
  const identity = getSignatureIdentity(signature.signature);

  const lockedPatternRow: Record<string, string> = {
    Sprinter: "Your pressure-to-momentum pattern",
    Archivist: "Your overload threshold pattern",
    Spark: "Your novelty-to-follow-through pattern",
    Reactor: "Your mood-to-focus pattern",
    Drifter: "Your attention anchor pattern",
  };
  const rows = [
    lockedPatternRow[signature.signature] ?? "Your focus pattern",
    "Your best starting conditions",
    "Your recovery rhythm",
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        borderRadius: 16,
        border: `1px solid rgba(${identity.accentRgb},0.22)`,
        background: "linear-gradient(180deg, rgba(14,18,32,0.8), rgba(8,10,18,0.9))",
        padding: 14,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <SignatureSigil signatureKey={signature.signature} size={46} withGlow />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <Lock size={12} color="var(--v2-gold)" />
          <HudLabel tone="gold" style={{ fontSize: 9.5 }}>Your full pattern map</HudLabel>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {rows.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 9,
                background: "rgba(148,163,255,0.05)",
                border: "1px solid var(--v2-line)",
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--v2-ink-dim)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </span>
              <span
                aria-hidden="true"
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  width: 42,
                  height: 6,
                  borderRadius: 999,
                  background: "repeating-linear-gradient(90deg, rgba(163,178,255,0.25) 0 6px, rgba(163,178,255,0.08) 6px 12px)",
                }}
              />
            </div>
          ))}
        </div>
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

      {/* One concise secure-payment signal, next to the actual checkout. */}
      <p style={{ marginTop: 12, fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Lock size={11} strokeWidth={2.5} /> {SECURE_PAYMENT_LINE}
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
    const el = document.getElementById(PAYWALL_CHECKOUT_ID);
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

          {/* ── Primary offer: one definitive block answering what it is, what
              you get, the price, one-time, and where to pay. Everything the
              buyer needs sits here; checkout is the very next panel. */}
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

            {/* three concrete deliverables */}
            <div style={{ marginTop: 14, display: "grid", gap: 9 }}>
              {paywallDeliverables(signature.planFocus).map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: "rgba(217,188,127,0.14)", border: "1px solid rgba(217,188,127,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={10} color="var(--v2-gold)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13.5, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* compact personalized artifact cue */}
            <div style={{ marginTop: 16 }}>
              <ArtifactPreview />
            </div>

            {/* price — the one definitive price presentation */}
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span className="v2-display v2-text-gold" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {BRAIN_OS.price.paywall}
              </span>
              <span style={{ fontSize: 12, color: "var(--v2-ink-ghost)", textDecoration: "line-through" }}>
                {BRAIN_OS.price.paywallAnchor}
              </span>
              <span className="v2-hud" style={{ fontSize: 9 }}>one-time</span>
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

            {/* one scannable trust line + the non-diagnosis boundary, stated once */}
            <p style={{ marginTop: 11, fontSize: 11.5, color: "var(--v2-ink-faint)", textAlign: "center", lineHeight: 1.5 }}>
              {TRUST_LINE_ITEMS.join(" · ")}
            </p>
            <p style={{ marginTop: 4, fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center", lineHeight: 1.5 }}>
              {NON_DIAGNOSIS_LINE}
            </p>
          </m.div>

          {/* Checkout sits immediately after the offer — no second offer in between. */}
          <m.div
            id={PAYWALL_CHECKOUT_ID}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
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

          {/* one compact, truthful post-payment expectation */}
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto" }}>
            {POST_PAYMENT_EXPECTATION}
          </p>

          {/* three collapsed FAQ items */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10 }}
            className="v2-panel"
            style={{ padding: "4px 8px" }}
          >
            {PAYWALL_FAQ.map(({ q, a }, i) => (
              <details
                key={q}
                className="v2-faq"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--v2-line)" }}
              >
                <summary
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "13px 10px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--v2-ink)",
                  }}
                >
                  <span>{q}</span>
                  <span className="v2-faq-icon" aria-hidden="true" style={{ fontSize: 18, fontWeight: 400, lineHeight: 1, color: "var(--v2-ink-faint)" }}>
                    +
                  </span>
                </summary>
                <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.55, padding: "0 10px 13px" }}>
                  {a}
                </p>
              </details>
            ))}
          </m.div>

          <p style={{ textAlign: "center", fontSize: 11, color: "var(--v2-ink-ghost)", marginTop: 2, lineHeight: 2 }}>
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

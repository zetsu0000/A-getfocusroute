"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, CreditCard, Lock, Check, RefreshCcw } from "lucide-react";
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
import { PaywallSocialProofDisclosure } from "@/components/signature/SocialProof";
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
  PAYWALL_TRUST_CHECKOUT_ID,
  POST_PAYMENT_EXPECTATION,
  SECURE_PAYMENT_LINE,
  TRUST_LINE,
  payCtaLabel,
  paywallDeliverables,
} from "./paywallContent";
import {
  canStartCheckoutRequest,
  checkoutLoadErrorForStatus,
  hasCheckoutClientSecret,
  type CheckoutLoadError,
} from "./paywallCheckout";

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
  document.getElementById(PAYWALL_TRUST_CHECKOUT_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          minHeight: 58,
          padding: "17px 22px",
          borderRadius: 16,
          fontSize: 16.5,
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
            {payCtaLabel(BRAIN_OS.price.paywall)}
          </>
        )}
      </m.button>

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
    () => ({ clientSecret, appearance: stripeAppearance, locale: "en" as const }),
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
    <div
      aria-busy="true"
      aria-label="Preparing secure payment fields"
      role="status"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      {[56, 56, 50].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, background: "rgba(148,163,255,0.08)", border: "1px solid var(--v2-line)" }} />
      ))}
      <div style={{ height: 58, borderRadius: 16, background: "rgba(217,188,127,0.1)", border: "1px solid rgba(217,188,127,0.25)", marginTop: 4 }} />
    </div>
  );
}

/* Main PaywallScreen */
export function PaywallScreen() {
  const { name, email, setStep, quizResultId, answers } = useQuizStore();
  const displayName = safeName(name, "Your");
  const signature = getSignatureFromAnswers(answers);
  const echo = echoSentence(answers);
  const reduceMotion = useReducedMotion();

  const handlePaywallSuccess = () => {
    setStep("upsell");
  };

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const [checkoutError, setCheckoutError] = useState<CheckoutLoadError | null>(null);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(null);
  const [retryClock, setRetryClock] = useState(() => Date.now());
  const checkoutRequestInFlightRef = useRef(false);
  const checkoutCtaTrackedRef = useRef(false);
  const retryBlocked = retryBlockedUntil !== null && retryBlockedUntil > retryClock;

  /* Reset the page to the top when the paywall first mounts. The previous
     result screen can leave the window scrolled down, which would otherwise
     clip the top of the offer panel. Mount-only (empty deps) so it never
     reruns when Stripe loads or social proof expands, and it uses an instant
     (non-smooth) scroll so it can't fight the top CTA's scroll-to-checkout. */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  /* checkout_section_reached: fires once when the payment section actually
     enters the viewport. This — not paywall_viewed and not
     payment_intent_created (which is recorded on server success) — is the "user got to
     where money moves" signal. */
  const checkoutReachedRef = useRef(false);
  useEffect(() => {
    if (!checkoutRequested) return;
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
  }, [checkoutRequested]);

  useEffect(() => {
    if (retryBlockedUntil === null) return;
    const delay = Math.max(0, retryBlockedUntil - Date.now());
    const timer = window.setTimeout(() => setRetryClock(Date.now()), delay + 250);
    return () => window.clearTimeout(timer);
  }, [retryBlockedUntil]);

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

  const requestCheckoutIntent = async () => {
    const now = Date.now();
    if (
      !canStartCheckoutRequest({
        clientSecret,
        loading: loadingSecret || checkoutRequestInFlightRef.current,
        retryBlockedUntil,
        nowMs: now,
      })
    ) {
      return;
    }

    checkoutRequestInFlightRef.current = true;
    setCheckoutRequested(true);
    setLoadingSecret(true);
    setCheckoutError(null);
    setRetryClock(now);

    const analyticsEventId = createAnalyticsEventId("initiate_checkout");
    try {
      const response = await fetch("/api/create-payment-intent", {
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
      });

      if (!response.ok) {
        const error = checkoutLoadErrorForStatus(
          response.status,
          response.headers.get("Retry-After"),
        );
        setCheckoutError(error);
        if (error.retryAfterSeconds !== undefined) {
          const blockedUntil = Date.now() + error.retryAfterSeconds * 1000;
          setRetryBlockedUntil(blockedUntil);
          setRetryClock(Date.now());
        }
        return;
      }

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        // Handled by the safe generic message below.
      }

      if (hasCheckoutClientSecret(data)) {
        setClientSecret(data.clientSecret);
        setCheckoutError(null);
        setRetryBlockedUntil(null);
        return;
      }

      setCheckoutError(checkoutLoadErrorForStatus(500, null));
    } catch {
      setCheckoutError(checkoutLoadErrorForStatus(500, null));
    } finally {
      checkoutRequestInFlightRef.current = false;
      setLoadingSecret(false);
    }
  };

  const handleCheckoutCtaClick = () => {
    if (!checkoutCtaTrackedRef.current) {
      checkoutCtaTrackedRef.current = true;
      trackEvent(FIRST_PARTY_EVENTS.checkoutCtaClicked, {
        meta: false,
        metadata: { product_key: "brain_profile", cta_location: "paywall_offer_top" },
      });
    }
    setCheckoutRequested(true);
    void requestCheckoutIntent();
    scrollToCheckout();
  };

  const handleCheckoutRetry = () => {
    setCheckoutRequested(true);
    void requestCheckoutIntent();
  };

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
              {paywallDeliverables().map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: "rgba(217,188,127,0.14)", border: "1px solid rgba(217,188,127,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                    <Check size={10} color="var(--v2-gold)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13.5, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
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

            {/* Top CTA — restrained gold (Fable a1cbe8a vocabulary): a dark
                premium surface with a subtle gold border and inner highlight.
                It starts checkout preparation; it does not pay. Deliberately
                quieter than the final payment CTA — related, not identical. */}
            <m.button
              type="button"
              onClick={handleCheckoutCtaClick}
              disabled={loadingSecret || retryBlocked}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              whileHover={reduceMotion || loadingSecret || retryBlocked ? undefined : { y: -1 }}
              style={{
                marginTop: 14,
                width: "100%",
                minHeight: 54,
                padding: "15px 22px",
                borderRadius: 16,
                fontSize: 15.25,
                fontWeight: 750,
                letterSpacing: "0.01em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                cursor: loadingSecret || retryBlocked ? "not-allowed" : "pointer",
                color: "var(--v2-gold-bright)",
                border: "1px solid rgba(217,188,127,0.42)",
                background:
                  "linear-gradient(120deg, rgba(217,188,127,0.12), rgba(240,220,174,0.04)), rgba(14,11,4,0.55)",
                boxShadow:
                  "0 0 0 1px rgba(8,6,2,0.4), inset 0 1px 0 rgba(255,248,226,0.14)",
                opacity: loadingSecret || retryBlocked ? 0.72 : 1,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <CreditCard size={15} strokeWidth={2.35} />
              {loadingSecret ? "Preparing secure checkout..." : "Continue to Secure Checkout"}
            </m.button>

            {/* one quiet trust line + the non-diagnosis boundary, stated once —
                a single editorial sentence, not three separate chips */}
            <p style={{ marginTop: 12, fontSize: 11.5, color: "var(--v2-ink-faint)", textAlign: "center", lineHeight: 1.55 }}>
              {TRUST_LINE}
            </p>
            <p style={{ marginTop: 4, fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center", lineHeight: 1.5 }}>
              {NON_DIAGNOSIS_LINE}
            </p>
          </m.div>

          {/* Scroll target keeps customer proof visible before payment fields. */}
          <div id={PAYWALL_TRUST_CHECKOUT_ID} style={{ scrollMarginTop: 16 }} />

          <PaywallSocialProofDisclosure />

          <AnimatePresence>
            {checkoutRequested && (
              <m.div
                id={PAYWALL_CHECKOUT_ID}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ delay: 0.02, duration: 0.24 }}
                className="v2-panel"
                style={{ padding: "18px", borderColor: "rgba(217,188,127,0.34)", scrollMarginTop: 16 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Lock size={13} color="var(--v2-gold)" />
                  <HudLabel tone="gold">Secure checkout</HudLabel>
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
                  ) : checkoutError ? (
                    <m.div
                      key="error"
                      role="alert"
                      aria-live="polite"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ display: "grid", gap: 11, color: "#FFE3E3", textAlign: "left", background: "rgba(255,139,139,0.15)", border: "1px solid rgba(255,139,139,0.42)", borderRadius: 14, padding: "13px 14px" }}
                    >
                      <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>{checkoutError.message}</p>
                      </div>
                      {!retryBlocked && (
                        <button
                          type="button"
                          onClick={handleCheckoutRetry}
                          className="v2-ghost"
                          style={{ minHeight: 40, padding: "9px 13px", borderRadius: 12, justifySelf: "start", fontSize: 12.5 }}
                        >
                          <RefreshCcw size={13} strokeWidth={2.4} />
                          Try again
                        </button>
                      )}
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>

          {checkoutRequested && (
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto" }}>
              {POST_PAYMENT_EXPECTATION}
            </p>
          )}

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

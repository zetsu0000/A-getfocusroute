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
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  RefreshCcw,
  Zap,
  Calendar,
  Target,
} from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { BRAIN_OS } from "@/lib/positioning";
import { HudLabel } from "@/components/v2/primitives";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import {
  createAnalyticsEventId,
  getAnalyticsContext,
  getOrCreateActionEventId,
  trackEvent,
} from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import {
  canStartCheckoutRequest,
  checkoutLoadErrorForStatus,
  hasCheckoutClientSecret,
  type CheckoutLoadError,
} from "@/components/paywall/paywallCheckout";

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return _stripePromise;
}
const PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ROADMAP!;

/* Literal colors — the Payment Element iframe can't read page CSS vars. The
   dark object is the original vault; the light object mirrors .v2-light. */
const upsellStripeAppearanceDark = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#9BE8FF",
    colorBackground: "#10131F",
    colorText: "#EEF1FF",
    colorDanger: "#FF8B8B",
    fontFamily: "inherit",
    borderRadius: "12px",
  },
};

const upsellStripeAppearanceLight = {
  theme: "stripe" as const,
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

function UpsellStripeElements({
  clientSecret,
  onSuccess,
  onDecline,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onDecline: () => void;
}) {
  const { theme } = useFunnelTheme();
  const options = useMemo(
    () => ({
      clientSecret,
      appearance: theme === "light" ? upsellStripeAppearanceLight : upsellStripeAppearanceDark,
    }),
    [clientSecret, theme],
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
    if (submitErr) {
      setError(submitErr.message ?? "Error");
      trackEvent(FIRST_PARTY_EVENTS.paymentError, {
        meta: false,
        metadata: { product_key: "roadmap_28_day", stage: "element_submit" },
      });
      setLoading(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/assessment?step=subscription" },
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message ?? "Payment failed");
      trackEvent(FIRST_PARTY_EVENTS.paymentError, {
        meta: false,
        metadata: { product_key: "roadmap_28_day", stage: "confirm_payment" },
      });
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PaymentElement
        onReady={() => {
          trackEvent(FIRST_PARTY_EVENTS.paymentElementLoaded, {
            meta: false,
            metadata: { product_key: "roadmap_28_day" },
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
        className={loading ? undefined : "v2-cta v2-cta-gold"}
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
        {loading ? "Processing..." : `Add the ${BRAIN_OS.protocol} — ${BRAIN_OS.price.upsell}`}
      </m.button>

      <button
        type="button"
        onClick={onDecline}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--v2-ink-dim)", textDecoration: "underline", padding: "10px 0" }}
      >
        No thanks — continue without it
      </button>
    </form>
  );
}

function UpsellDeclineButton({ onDecline }: { onDecline: () => void }) {
  return (
    <button
      type="button"
      onClick={onDecline}
      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--v2-ink-dim)", textDecoration: "underline", padding: "10px 0", width: "100%" }}
    >
      No thanks — continue without it
    </button>
  );
}

function UpsellPaymentSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Preparing secure payment fields"
      role="status"
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}
    >
      <div style={{ height: 52, borderRadius: 12, background: "rgba(148,163,255,0.08)", border: "1px solid var(--v2-line)" }} />
      <div style={{ height: 52, borderRadius: 12, background: "rgba(148,163,255,0.08)", border: "1px solid var(--v2-line)" }} />
      <div style={{ height: 58, borderRadius: 999, background: "rgba(217,188,127,0.1)", border: "1px solid rgba(217,188,127,0.25)" }} />
    </div>
  );
}

/* Mini route map: 28 day-nodes extending from the profile the user now owns. */
function ProtocolRouteStrip() {
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", padding: "2px 0" }}>
      {Array.from({ length: 28 }, (_, i) => (
        <m.span
          key={i}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.018, duration: 0.25 }}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: i < 4
              ? "var(--v2-grad-signal)"
              : "rgba(148,163,255,0.14)",
            border: i < 4 ? "none" : "1px solid rgba(163,178,255,0.25)",
            boxShadow: i < 4 ? "0 0 8px rgba(124,138,255,0.6)" : "none",
          }}
        />
      ))}
      <span className="v2-hud" style={{ fontSize: 8.5, marginLeft: 6 }}>28 days</span>
    </div>
  );
}

/* Main UpsellScreen */
export function UpsellScreen() {
  const { name, email, setStep, quizResultId } = useQuizStore();
  const displayName = name || "You";
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const [checkoutError, setCheckoutError] = useState<CheckoutLoadError | null>(null);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(null);
  const [retryClock, setRetryClock] = useState(() => Date.now());
  const checkoutRequestInFlightRef = useRef(false);
  const checkoutCtaTrackedRef = useRef(false);
  const retryBlocked = retryBlockedUntil !== null && retryBlockedUntil > retryClock;

  useEffect(() => {
    /* Distinct upsell-stage signal; the paywall_viewed below keeps its
       legacy product_key-scoped firing for continuity. */
    trackEvent(FIRST_PARTY_EVENTS.upsellViewed, {
      meta: false,
      metadata: { product_key: "roadmap_28_day" },
    });
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
  }, []);

  useEffect(() => {
    if (retryBlockedUntil === null) return;
    const delay = Math.max(0, retryBlockedUntil - Date.now());
    const timer = window.setTimeout(() => setRetryClock(Date.now()), delay + 250);
    return () => window.clearTimeout(timer);
  }, [retryBlockedUntil]);

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
          funnel_step: "upsell",
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
        metadata: { product_key: "roadmap_28_day", cta_location: "upsell_offer" },
      });
    }
    setCheckoutRequested(true);
    void requestCheckoutIntent();
  };

  const handleCheckoutRetry = () => {
    setCheckoutRequested(true);
    void requestCheckoutIntent();
  };

  const handleSuccess = () => setStep("subscription");
  const handleDecline = () => {
    trackEvent(FIRST_PARTY_EVENTS.upsellSkipped, {
      meta: false,
      metadata: { product_key: "roadmap_28_day" },
    });
    setStep("subscription");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh", padding: "0 0 56px" }}
    >
      {/* Offer context */}
      <div style={{
        background: "linear-gradient(90deg, rgba(124,138,255,0.16), rgba(155,232,255,0.08))",
        borderBottom: "1px solid var(--v2-line)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap",
      }}>
        <Target size={15} color="var(--v2-signal-2)" />
        <p className="v2-hud" style={{ fontSize: 10, color: "var(--v2-ink-dim)", flexShrink: 1, textAlign: "center" }}>
          Optional protocol expansion · one-time purchase · instant access
        </p>
      </div>

      <div style={{ padding: "28px 16px", maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Header */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <HudLabel tone="signal" style={{ marginBottom: 12 }}>
            Route extension
          </HudLabel>
          <h1
            className="v2-display"
            style={{ fontSize: "clamp(25px, 6.4vw, 31px)", fontWeight: 550, lineHeight: 1.18, marginBottom: 10 }}
          >
            {displayName}, you just mapped your brain.{" "}
            <em className="v2-text-signal" style={{ fontStyle: "italic" }}>
              Turn insight into a daily system.
            </em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.65 }}>
            This is a separate, optional add-on — not the profile you just unlocked.
          </p>
        </m.div>

        {/* Already-yours vs. adds — kills "am I buying the same thing twice?" */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="v2-panel" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--v2-line)" }}>
            <HudLabel style={{ marginBottom: 6, fontSize: 9.5 }}>Already yours</HudLabel>
            <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.55 }}>
              Your Brain Profile — your pattern, your radar map, and your first next steps.
            </p>
          </div>
          <div style={{ padding: "15px 18px", background: "rgba(124,138,255,0.06)" }}>
            <HudLabel tone="signal" style={{ marginBottom: 6, fontSize: 9.5 }}>This adds</HudLabel>
            <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.55, marginBottom: 10 }}>
              The {BRAIN_OS.protocol} — a day-by-day practice system built on that profile: 28 short daily actions instead of figuring out each day yourself.
            </p>
            <ProtocolRouteStrip />
          </div>
        </m.div>

        {/* What's inside */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
          className="v2-panel" style={{ padding: "20px 22px" }}>
          <HudLabel style={{ marginBottom: 16 }}>
            What&apos;s inside the {BRAIN_OS.protocol}
          </HudLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {[
              { icon: Calendar, title: "Day-by-day action plan", desc: "28 structured daily actions matched to your signature profile." },
              { icon: Target,   title: "Pattern-specific strategies", desc: "Task initiation, sustained focus, and reset planning covered step by step." },
              { icon: Zap,      title: "Executive function tools", desc: "Time-boxing, reset cues, and attention anchors selected for your profile." },
              { icon: CheckCircle2, title: "Weekly milestone check-ins", desc: "Track real progress with your personalized metrics." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: "rgba(124,138,255,0.1)", border: "1px solid rgba(124,138,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={15} color="var(--v2-signal-2)" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--v2-ink)", marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </m.div>

        {/* Price anchor */}
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="v2-panel" style={{ padding: "18px 20px", borderColor: "rgba(217,188,127,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--v2-ink)" }}>{BRAIN_OS.protocol}</p>
              <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", marginTop: 2 }}>One-time purchase · Instant access</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "var(--v2-ink-ghost)", textDecoration: "line-through" }}>{BRAIN_OS.price.upsellAnchor}</p>
              <p className="v2-display v2-text-gold" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{BRAIN_OS.price.upsell}</p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.5, marginTop: 8 }}>
            Why {BRAIN_OS.price.upsell} instead of {BRAIN_OS.price.upsellAnchor}? The Protocol is generated from the profile you already own — so you get its add-on price in this session.
          </p>

          <div style={{ height: 1, background: "var(--v2-line)", margin: "14px 0" }} />

          {!checkoutRequested ? (
            <>
              <m.button
                type="button"
                onClick={handleCheckoutCtaClick}
                disabled={loadingSecret || retryBlocked}
                aria-busy={loadingSecret}
                whileTap={{ scale: 0.975 }}
                whileHover={loadingSecret || retryBlocked ? undefined : { y: -1 }}
                className={loadingSecret || retryBlocked ? undefined : "v2-cta v2-cta-gold"}
                style={{
                  width: "100%",
                  minHeight: 58,
                  padding: "18px 24px",
                  borderRadius: 999,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: loadingSecret || retryBlocked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  ...(loadingSecret || retryBlocked
                    ? {
                        background: "rgba(148,163,255,0.06)",
                        border: "1px solid var(--v2-line)",
                        color: "var(--v2-ink-faint)",
                      }
                    : {}),
                }}
              >
                <CreditCard size={16} strokeWidth={2.4} />
                {loadingSecret ? "Preparing secure checkout..." : "Continue to Secure Checkout"}
              </m.button>
              <UpsellDeclineButton onDecline={handleDecline} />
            </>
          ) : loadingSecret ? (
            <>
              <UpsellPaymentSkeleton />
              <UpsellDeclineButton onDecline={handleDecline} />
            </>
          ) : clientSecret ? (
            <UpsellStripeElements
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onDecline={handleDecline}
            />
          ) : checkoutError ? (
            <>
              <div
                role="alert"
                aria-live="polite"
                style={{ display: "grid", gap: 11, color: dark ? "#FFE3E3" : "var(--v2-error)", textAlign: "left", background: dark ? "rgba(255,139,139,0.15)" : "rgba(197,58,46,0.08)", border: dark ? "1px solid rgba(255,139,139,0.42)" : "1px solid rgba(197,58,46,0.30)", borderRadius: 14, padding: "13px 14px" }}
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
              </div>
              <UpsellDeclineButton onDecline={handleDecline} />
            </>
          ) : (
            <UpsellDeclineButton onDecline={handleDecline} />
          )}

        </m.div>

      </div>
    </m.div>
  );
}

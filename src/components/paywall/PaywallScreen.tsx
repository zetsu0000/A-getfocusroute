"use client";

import { useState, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Shield, Lock, Check, BadgeCheck, CreditCard } from "lucide-react";
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
import { getSignatureFromAnswers } from "@/lib/signature";

// Lazy singleton — loadStripe (and the Stripe.js download) only fires
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

/* ── Locked result card ── */
function LockedCard() {
  const answers = useQuizStore((s) => s.answers);
  const signature = getSignatureFromAnswers(answers);
  const profileBandBySignature: Record<string, { label: string; pct: number; color: string; bg: string; shadow: string }> = {
    Sprinter: { label: "Fast-cycle",     pct: 68, color: "var(--color-sig-sprinter)",  bg: "var(--color-sig-sprinter-tint)",  shadow: "var(--shadow-sig-sprinter)"  },
    Archivist: { label: "Detail-led",   pct: 46, color: "var(--color-sig-archivist)", bg: "var(--color-sig-archivist-tint)", shadow: "var(--shadow-sig-archivist)" },
    Spark: { label: "Novelty-led",      pct: 76, color: "var(--color-sig-spark)",     bg: "var(--color-sig-spark-tint)",     shadow: "var(--shadow-sig-spark)"     },
    Reactor: { label: "Adaptive",       pct: 58, color: "var(--color-sig-reactor)",   bg: "var(--color-sig-reactor-tint)",   shadow: "var(--shadow-sig-reactor)"   },
    Drifter: { label: "Anchor-seeking", pct: 39, color: "var(--color-sig-drifter)",   bg: "var(--color-sig-drifter-tint)",   shadow: "var(--shadow-sig-drifter)"   },
  };
  const profileBand = profileBandBySignature[signature.signature] ?? profileBandBySignature.Drifter;

  const rows = [
    { label: "Cognitive Signature™", value: signature.signature },
    { label: "Focus consistency index", value: "78 / 100" },
    { label: "Executive friction pattern", value: "Context switching" },
    { label: "Priority implementation lever", value: "Body-doubling" },
  ];

  return (
    <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-bg-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>

      {/* Card header */}
      <div style={{ padding: "16px 20px 14px", background: "linear-gradient(135deg, var(--color-primary-tint), var(--color-bg-card-2))", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, var(--color-cognitive-dark), var(--color-cognitive))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 12px 28px rgba(76,63,215,0.22)" }}>
          <BadgeCheck size={19} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>Your FocusRoute Brain Profile™</p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>Cognitive Mapping Assessment™ · Completed</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: profileBand.bg, color: profileBand.color }}>
          {profileBand.label}
        </span>
      </div>

      {/* Gauge */}
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Profile intensity band</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: profileBand.color }}>{profileBand.label}</span>
        </div>
        <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "linear-gradient(to right, var(--color-primary-tint), var(--color-cognitive-tint), var(--color-cognitive))", position: "relative" }}>
          <m.div
            initial={{ left: "0%" }}
            animate={{ left: `${profileBand.pct}%` }}
            transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "var(--color-bg-card)", border: `3px solid ${profileBand.color}`, boxShadow: profileBand.shadow }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["Anchored","Steady","Mixed","High-drive","Burst"].map((l) => (
            <span key={l} style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Blurred rows */}
      <div style={{ padding: "0 20px 20px", position: "relative" }}>
        <div style={{ filter: "blur(4px)", userSelect: "none", pointerEvents: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-card-2)", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: 12, color: "var(--color-text-body)" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <m.div
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ width: 50, height: 50, borderRadius: 15, background: "linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-btn-accent)" }}
          >
            <Lock size={22} color="white" strokeWidth={2.5} />
          </m.div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", textAlign: "center", lineHeight: 1.3 }}>
            Unlock to reveal<br />your full profile
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Stripe checkout form ── */
function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
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
      confirmParams: { return_url: window.location.origin + "/assessment?step=upsell" },
      redirect: "if_required",
    });

    if (confirmErr) { setError(confirmErr.message ?? "Payment failed"); setLoading(false); }
    else            { onSuccess(); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
          fields: { billingDetails: { name: "auto" } },
        }}
      />

      {error && (
        <m.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: 12, fontSize: 13, color: "var(--color-error)", textAlign: "center", background: "var(--color-error-tint)", borderRadius: 10, padding: "8px 14px" }}
        >
          ⚠️ {error}
        </m.p>
      )}

      <m.button
        type="submit"
        disabled={!stripe || loading}
        whileTap={{ scale: 0.975 }}
        animate={loading ? {} : {
          boxShadow: [
            "0 10px 30px rgba(20,17,31,0.22)",
            "0 14px 38px rgba(20,17,31,0.3)",
            "0 10px 30px rgba(20,17,31,0.22)",
          ],
          transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
        }}
        style={{
          marginTop: 16, width: "100%", padding: "18px 24px", borderRadius: "var(--radius-md)",
          background: loading
            ? "var(--color-border)"
            : "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))",
          color: loading ? "var(--color-text-muted)" : "#fff",
          fontSize: 17, fontWeight: 800, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}
      >
        {loading ? (
          <>
            <m.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--color-text-muted)", borderTopColor: "transparent", borderRadius: "50%" }}
            />
            Processing…
          </>
        ) : (
          <>
            <Lock size={17} color="white" strokeWidth={2.5} />
            Unlock My Brain Profile — {BRAIN_OS.price.paywall}
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
        One-time access · Backed by the &quot;This Is Me&quot; 7-Day Guarantee
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

/* ── Loading skeleton ── */
function PaymentSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "pulse 1.6s ease-in-out infinite" }}>
      {[56, 56, 50].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: "var(--radius-sm)", background: "var(--color-border)" }} />
      ))}
      <div style={{ height: 58, borderRadius: "var(--radius-md)", background: "var(--color-border)", marginTop: 4 }} />
    </div>
  );
}

/* ── Main PaywallScreen ── */
export function PaywallScreen() {
  const { name, email, setStep, quizResultId } = useQuizStore();
  const displayName              = safeName(name, "You");

  const handlePaywallSuccess = () => {
    setStep("upsell");
  };

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: PRICE_ID,
        email,
        funnel_step: "paywall",
        quiz_result_id: quizResultId ?? "",
        user_name: name,
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret); })
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
            {["Secure checkout", "Instant access", "Private assessment data"].map((item) => (
              <span key={item} style={{ fontSize: 12, color: "var(--color-text-body)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <BadgeCheck size={13} color="var(--color-success)" strokeWidth={2.5} />
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
                Your results
              </p>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.22, letterSpacing: "-0.02em" }}>
                {displayName}, your {BRAIN_OS.brainProfile} is ready.
              </h1>
              <p style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.62 }}>
                Unlock the complete profile report for <strong style={{ color: "var(--color-text)" }}>{BRAIN_OS.price.paywall}</strong> and keep your personalized FocusRoute insights in your account.
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
                  {BRAIN_OS.lineTm}
                </p>
                <p style={{ fontSize: 13, color: "var(--color-text-body)", marginTop: 2 }}>
                  Premium report access
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

            <div style={{ marginBottom: 12, display: "grid", gap: 8 }}>
              {BRAIN_OS.paywallUnlockBullets.map((item) => (
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
                FocusRoute is not a medical diagnosis and does not replace clinical evaluation.
              </p>
            </div>
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
              Secure checkout via Stripe · encrypted payment · instant profile access
            </p>
          </m.div>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)", marginTop: 6, lineHeight: 2 }}>
            <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
            {" · "}
            <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
            {" · "}
            <a href="/refund-policy" style={{ color: "inherit", textDecoration: "none" }}>Refunds</a>
            {" · "}
            <a href="/disclaimer" style={{ color: "inherit", textDecoration: "none" }}>Disclaimer</a>
          </p>
        </div>
      </div>
    </m.div>
  );
}

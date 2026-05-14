"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Shield, Star, Lock, Check, BadgeCheck, CreditCard } from "lucide-react";
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
import { scoreFromAnswers, getSymptomLevel } from "@/lib/symptom-level";

// Lazy singleton — loadStripe (and the Stripe.js download) only fires
// when the PaywallScreen first renders, not when the chunk is prefetched.
let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return _stripePromise;
}
const PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ASSESSMENT!;

/* ── Countdown — persisted in sessionStorage ── */
const COUNTDOWN_KEY = "focusroute_countdown_end";

function useCountdown(initial = 600) {
  const [secs, setSecs] = useState<number>(() => {
    if (typeof window === "undefined") return initial;
    const stored = sessionStorage.getItem(COUNTDOWN_KEY);
    if (stored) {
      const remaining = Math.round((Number(stored) - Date.now()) / 1000);
      if (remaining > 0) return remaining;
    }
    const end = Date.now() + initial * 1000;
    sessionStorage.setItem(COUNTDOWN_KEY, String(end));
    return initial;
  });

  useEffect(() => {
    const t = setInterval(() =>
      setSecs((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      }), 1000);
    return () => clearInterval(t);
  }, []);

  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { display: `${m}:${s}`, urgent: secs < 120 };
}

/* ── Locked result card ── */
function LockedCard() {
  const answers = useQuizStore((s) => s.answers);
  const level   = getSymptomLevel(scoreFromAnswers(answers));

  const rows = [
    { label: "ADHD Subtype",          value: "Inattentive-C" },
    { label: "Procrastination index", value: "78 / 100"      },
    { label: "Focus pattern",         value: "Hyperactive"   },
    { label: "Priority strategy",     value: "Body-doubling" },
  ];

  return (
    <div style={{ borderRadius: 22, overflow: "hidden", background: "#fff", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>

      {/* Card header */}
      <div style={{ padding: "16px 20px 14px", background: "linear-gradient(135deg,#EAF2F8,#F5F3EE)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#4A7FA5,#6AA3C8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1C1A2E" }}>Your ADHD Profile</p>
          <p style={{ fontSize: 11, color: "#9B9BB5", marginTop: 1 }}>Diagnostic assessment · Completed</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: level.bg, color: level.color }}>
          {level.label}
        </span>
      </div>

      {/* Gauge */}
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#9B9BB5" }}>ADHD Symptom Level</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: level.color }}>{level.label}</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "linear-gradient(to right,#EAF2F8,#6AA3C8,#F5C17A,#E87450,#A82E2E)", position: "relative" }}>
          <m.div
            initial={{ left: "0%" }}
            animate={{ left: `${level.pct}%` }}
            transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `3px solid ${level.color}`, boxShadow: `0 2px 8px ${level.color}55` }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["Low","Mild","Moderate","High","Very High"].map((l) => (
            <span key={l} style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Blurred rows */}
      <div style={{ padding: "0 20px 20px", position: "relative" }}>
        <div style={{ filter: "blur(4px)", userSelect: "none", pointerEvents: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "#FAF9F6", border: "1px solid #EAE6DC" }}>
              <span style={{ fontSize: 12, color: "#4A4A6A" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4A7FA5" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <m.div
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ width: 50, height: 50, borderRadius: 15, background: "linear-gradient(135deg,#E87450,#CC5C3A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(232,116,80,0.45)" }}
          >
            <Lock size={22} color="white" strokeWidth={2.5} />
          </m.div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1C1A2E", textAlign: "center", lineHeight: 1.3 }}>
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
      confirmParams: { return_url: window.location.origin + "/?step=upsell" },
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
          style={{ marginTop: 12, fontSize: 13, color: "#E87450", textAlign: "center", background: "#FDF1EC", borderRadius: 10, padding: "8px 14px" }}
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
            "0 4px 22px rgba(232,116,80,0.40)",
            "0 6px 32px rgba(232,116,80,0.60)",
            "0 4px 22px rgba(232,116,80,0.40)",
          ],
          transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
        }}
        style={{
          marginTop: 16, width: "100%", padding: "18px 24px", borderRadius: 16,
          background: loading
            ? "#EAE6DC"
            : "linear-gradient(135deg, #E87450, #CC5C3A)",
          color: loading ? "#9B9BB5" : "#fff",
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
              style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #9B9BB5", borderTopColor: "transparent", borderRadius: "50%" }}
            />
            Processing…
          </>
        ) : (
          <>
            <Lock size={17} color="white" strokeWidth={2.5} />
            Unlock my results — $27
          </>
        )}
      </m.button>

      {/* Trust row */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        {[
          { icon: Shield,    label: "256-bit SSL" },
          { icon: CreditCard, label: "Secure payment" },
          { icon: BadgeCheck, label: "Instant access" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon size={13} color="#9B9BB5" />
            <span style={{ fontSize: 11, color: "#9B9BB5" }}>{label}</span>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: "#9B9BB5", textAlign: "center" }}>
        One-time · No subscription · No hidden fees
      </p>
    </form>
  );
}

/* ── Loading skeleton ── */
function PaymentSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "pulse 1.6s ease-in-out infinite" }}>
      {[56, 56, 50].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, background: "#EAE6DC" }} />
      ))}
      <div style={{ height: 58, borderRadius: 16, background: "#EAE6DC", marginTop: 4 }} />
    </div>
  );
}

/* ── Main PaywallScreen ── */
export function PaywallScreen() {
  const { name, email, setStep } = useQuizStore();
  const { display, urgent }     = useCountdown(600);
  const displayName              = safeName(name, "You");

  const handlePaywallSuccess = () => {
    const { email: e, name: n, answers } = useQuizStore.getState();
    saveSession({ email: e, name: n, planType: "assessment", purchasedAt: new Date().toISOString(), answers });
    setStep("upsell");
  };

  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: PRICE_ID, email }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret); })
      .finally(() => setLoadingSecret(false));
  }, [email]);

  const stripeAppearance = {
    theme: "flat" as const,
    variables: {
      colorPrimary:     "#4A7FA5",
      colorBackground:  "#FFFFFF",
      colorText:        "#1C1A2E",
      colorTextSecondary: "#4A4A6A",
      colorTextPlaceholder: "#9B9BB5",
      colorDanger:      "#E87450",
      colorWarning:     "#F07000",
      colorSuccess:     "#3DA06A",
      fontFamily:       "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSizeBase:     "15px",
      spacingUnit:      "5px",
      borderRadius:     "12px",
      gridColumnSpacing: "12px",
      gridRowSpacing:    "12px",
    },
    rules: {
      ".Input": {
        border:          "1.5px solid #EAE6DC",
        backgroundColor: "#FAF9F6",
        padding:         "12px 14px",
        fontSize:        "15px",
        boxShadow:       "none",
        transition:      "border-color 0.15s",
      },
      ".Input:focus": {
        border:    "1.5px solid #4A7FA5",
        boxShadow: "0 0 0 3px rgba(74,127,165,0.12)",
        outline:   "none",
      },
      ".Label": {
        fontSize:   "12px",
        fontWeight: "600",
        color:      "#4A4A6A",
        marginBottom: "5px",
      },
      ".Tab": {
        border:          "1.5px solid #EAE6DC",
        backgroundColor: "#FAF9F6",
        padding:         "10px 16px",
        fontWeight:      "600",
      },
      ".Tab--selected": {
        border:          "1.5px solid #4A7FA5",
        backgroundColor: "#EAF2F8",
        color:           "#4A7FA5",
        boxShadow:       "none",
      },
      ".Error": {
        color:    "#E87450",
        fontSize: "12px",
      },
    },
  };

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* ── Urgency bar ── */}
      <m.div
        animate={{ backgroundColor: urgent ? ["#CC5C3A", "#A82E2E", "#CC5C3A"] : ["#1C1A2E", "#1C1A2E"] }}
        transition={{ repeat: urgent ? Infinity : 0, duration: 1.2 }}
        style={{ padding: "11px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
      >
        <m.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ fontSize: 12 }}
        >🔴</m.span>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.01em" }}>
          Offer reserved for <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900 }}>{display}</span>
        </p>
      </m.div>

      {/* ── Page body ── */}
      <div style={{ padding: "24px 16px 64px", overflowX: "hidden" }}>
        <div style={{ maxWidth: 460, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>

          {/* ── Headline ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1C1A2E", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#4A7FA5" }}>{displayName}</span>, your ADHD profile is ready —{" "}
              <span style={{ color: "#E87450" }}>but still locked</span>
            </h1>
            <p style={{ marginTop: 10, fontSize: 14, color: "#4A4A6A", lineHeight: 1.65 }}>
              Unlock your full profile for a one-time payment of <strong style={{ color: "#1C1A2E" }}>$27</strong>. No subscription. Instant access.
            </p>
          </m.div>

          {/* ── Locked card ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
            <LockedCard />
          </m.div>

          {/* ── What's included ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            style={{ background: "#fff", borderRadius: 22, padding: "20px 22px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9B9BB5", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              What you unlock
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {[
                "Full ADHD type & symptom breakdown",
                "Personalized cognitive profile analysis",
                "28-day action guide for your subtype",
                "Science-backed focus & procrastination tools",
                "Executive function strategy toolkit",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EAF2F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={12} color="#4A7FA5" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </m.div>

          {/* ── Price + Payment form ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            style={{ background: "#fff", borderRadius: 24, boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)", overflow: "hidden", minWidth: 0 }}>

            {/* Price header */}
            <div style={{ padding: "20px 22px 18px", borderBottom: "1px solid #EAE6DC" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1C1A2E" }}>FocusRoute ADHD Assessment</p>
                  <p style={{ fontSize: 12, color: "#9B9BB5", marginTop: 3 }}>One-time · Lifetime access</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, color: "#9B9BB5", textDecoration: "line-through" }}>$189</p>
                  <p style={{ fontSize: 34, fontWeight: 900, color: "#E87450", lineHeight: 1, letterSpacing: "-0.03em" }}>$27</p>
                </div>
              </div>

              {/* Savings badge */}
              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#EAF2F8,#E8F4FB)", padding: "7px 14px", borderRadius: 99, border: "1px solid #C4DFEE" }}>
                <BadgeCheck size={14} color="#4A7FA5" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4A7FA5" }}>85% below the cheapest clinical evaluation ($189)</span>
              </div>
            </div>

            {/* Payment form */}
            <div style={{ padding: "22px 22px 22px", overflowX: "hidden", minWidth: 0 }}>
              <AnimatePresence mode="wait">
                {loadingSecret ? (
                  <m.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PaymentSkeleton />
                  </m.div>
                ) : clientSecret ? (
                  <m.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <Elements
                      stripe={getStripePromise()}
                      options={{ clientSecret, appearance: stripeAppearance }}
                    >
                      <CheckoutForm onSuccess={handlePaywallSuccess} />
                    </Elements>
                  </m.div>
                ) : (
                  <m.p key="error" style={{ fontSize: 13, color: "#E87450", textAlign: "center", padding: "16px 0" }}>
                    Failed to load payment. Please refresh the page.
                  </m.p>
                )}
              </AnimatePresence>
            </div>
          </m.div>

          {/* ── Social proof bar ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            style={{ background: "#fff", borderRadius: 18, padding: "14px 18px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex" }}>
              {["🧑‍💻","👩‍🎓","👨‍🏫","👩‍⚕️","🧑‍🎨"].map((e, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", fontSize: 13, background: "#EAF2F8", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i > 0 ? -9 : 0 }}>{e}</div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} style={{ fill: "#E87450", color: "#E87450" }} />
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E87450", marginLeft: 4 }}>4.9</span>
              </div>
              <p style={{ fontSize: 12, color: "#9B9BB5" }}>+200,000 people have discovered their profile</p>
            </div>
          </m.div>

          {/* ── Testimonials ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { quote: "The report was eye-opening. I finally understood why I struggle so much with focus — and the guide gave me tools that actually fit my brain.", author: "Rafael T.", role: "Systems Analyst" },
              { quote: "I took 3 other ADHD tests before this. FocusRoute was the first one that felt like it truly saw me. Worth every dollar.", author: "Mia K.", role: "UX Designer" },
            ].map(({ quote, author, role }) => (
              <div key={author} style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} style={{ fill: "#E87450", color: "#E87450" }} />
                  ))}
                </div>
                <p style={{ fontSize: 13, fontStyle: "italic", color: "#4A4A6A", lineHeight: 1.65, marginBottom: 10 }}>
                  &quot;{quote}&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EAF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                    {author[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1C1A2E", lineHeight: 1 }}>{author}</p>
                    <p style={{ fontSize: 11, color: "#9B9BB5" }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </m.div>

        </div>
      </div>
    </m.div>
  );
}

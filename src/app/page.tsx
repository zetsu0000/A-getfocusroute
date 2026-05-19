"use client";

import dynamic                      from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, m }  from "framer-motion";
import { useQuizStore }             from "@/store/quizStore";
import type { FunnelStep }          from "@/types/quiz";
import { getPersistedQuizResultId } from "@/lib/quizResultId";
import { createClient }             from "@/lib/supabase/client";
import { QuizEngine }               from "@/components/quiz/QuizEngine";

function ScreenSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// LoadingScreen, EmailScreen, NameScreen are not on the landing critical path:
// they only render after the user finishes the quiz (~20 questions in). Defer
// them with next/dynamic so they don't ship in the initial page chunk.
const LoadingScreen      = dynamic(() => import("@/components/loading/LoadingScreen").then(m => ({ default: m.LoadingScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const EmailScreen        = dynamic(() => import("@/components/email/EmailScreen").then(m => ({ default: m.EmailScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const NameScreen         = dynamic(() => import("@/components/name/NameScreen").then(m => ({ default: m.NameScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const ChartScreen        = dynamic(() => import("@/components/chart/ChartScreen").then(m => ({ default: m.ChartScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const PaywallScreen      = dynamic(() => import("@/components/paywall/PaywallScreen").then(m => ({ default: m.PaywallScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const UpsellScreen       = dynamic(() => import("@/components/upsell/UpsellScreen").then(m => ({ default: m.UpsellScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const SubscriptionScreen = dynamic(() => import("@/components/subscription/SubscriptionScreen").then(m => ({ default: m.SubscriptionScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const SuccessScreen      = dynamic(() => import("@/components/success/SuccessScreen").then(m => ({ default: m.SuccessScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });

const ENTRY_STEPS = new Set<FunnelStep>([
  "paywall",
  "upsell",
  "subscription",
  "success",
]);

function readEntryStep(): FunnelStep | null {
  if (typeof window === "undefined") return null;
  const step = new URLSearchParams(window.location.search).get("step");
  return ENTRY_STEPS.has(step as FunnelStep) ? (step as FunnelStep) : null;
}

function metadataName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function HomepageFunnel({ onStart }: { onStart: () => void }) {
  const recognition = [
    "You start strong, then stall.",
    "Simple tasks feel weirdly heavy.",
    "You know what to do, but can't enter the task.",
    "Rest doesn't always reset you.",
  ];

  const outcomes = [
    "Your Brain Profile",
    "Cognitive Signature",
    "Focus friction map",
    "Best starting conditions",
    "Recovery style",
    "Explain-It-To-Someone Script after unlock",
  ];

  const steps = [
    "Answer pattern-based questions",
    "Get your FocusRoute preview",
    "Unlock your full Brain Profile if it feels useful",
  ];

  const trust = ["Free", "3 minutes", "Private results", "Not a diagnosis"];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg-page)", overflowX: "hidden" }}>
      <section style={{ padding: "34px 18px 28px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--color-primary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            FocusRoute
          </p>
          <h1
            style={{
              fontSize: "clamp(34px, 10vw, 58px)",
              fontWeight: 900,
              color: "var(--color-text)",
              lineHeight: 1.04,
              marginBottom: 18,
            }}
          >
            You&apos;re not lazy. Your focus system is overloaded.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--color-text-body)",
              lineHeight: 1.65,
              marginBottom: 22,
              maxWidth: 540,
            }}
          >
            Take the free 3-minute FocusRoute assessment to map your focus patterns,
            friction points, and best next step.
          </p>
          <button
            type="button"
            onClick={onStart}
            style={{
              width: "100%",
              maxWidth: 360,
              border: "1px solid var(--color-accent)",
              borderRadius: 14,
              background: "var(--color-accent)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 900,
              padding: "16px 20px",
              boxShadow: "var(--shadow-btn-accent)",
            }}
          >
            Find My Focus Pattern
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 14px", marginTop: 16 }}>
            {trust.map((item) => (
              <span key={item} style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "10px 18px 26px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", display: "grid", gap: 9 }}>
          {recognition.map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 14,
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                padding: "13px 14px",
                boxShadow: "0 1px 2px rgba(23,20,33,0.05)",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.35 }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "22px 18px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            What you&apos;ll get
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 9 }}>
            {outcomes.map((item) => (
              <div key={item} style={{ borderRadius: 12, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", padding: "12px 12px" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.35 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "22px 18px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            How it works
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {steps.map((item, index) => (
              <div key={item} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 12, alignItems: "start" }}>
                <span style={{ width: 30, height: 30, borderRadius: 999, border: "1px solid var(--color-border-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary-dark)", fontSize: 12, fontWeight: 900 }}>
                  {index + 1}
                </span>
                <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.55, paddingTop: 4 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "22px 18px 38px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", borderTop: "1px solid var(--color-border)", paddingTop: 22 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: 18 }}>
            Your results are private. FocusRoute is built for self-understanding and
            productivity support. It is not a diagnosis, medical treatment, or a
            substitute for professional care.
          </p>
          <button
            type="button"
            onClick={onStart}
            style={{
              width: "100%",
              border: "1px solid var(--color-accent)",
              borderRadius: 14,
              background: "var(--color-accent)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 900,
              padding: "15px 18px",
            }}
          >
            Find My Focus Pattern
          </button>
        </div>
      </section>
    </div>
  );
}

// The quiz step uses opacity:0.01 (not 0) so the browser can measure LCP
// immediately on first paint instead of waiting for the animation to complete.
const fade = (isFirst = false) => ({
  initial:    { opacity: isFirst ? 0.01 : 0, x: isFirst ? 0 : 30  } as const,
  animate:    { opacity: 1, x: 0   } as const,
  exit:       { opacity: 0, x: -30 } as const,
  transition: { duration: 0.26 },
});

export default function Home() {
  const step = useQuizStore((s) => s.currentStep);
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
  const retakeMode = useQuizStore((s) => s.retakeMode);
  const email = useQuizStore((s) => s.email);
  const setQuizResultId = useQuizStore((s) => s.setQuizResultId);
  const setStep = useQuizStore((s) => s.setStep);
  const setEmail = useQuizStore((s) => s.setEmail);
  const setName = useQuizStore((s) => s.setName);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const id = getPersistedQuizResultId();
    if (id) {
      setQuizResultId(id);
    }
  }, [setQuizResultId]);

  useEffect(() => {
    const entryStep = readEntryStep();
    if (entryStep) setStep(entryStep);
  }, [setStep]);

  useEffect(() => {
    const entryStep = readEntryStep();
    if (!entryStep || email) return;

    let cancelled = false;

    async function hydrateSignedInUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user?.email) return;

        setEmail(user.email);
        const fullName =
          metadataName(user.user_metadata?.full_name) ||
          metadataName(user.user_metadata?.name);
        if (fullName) setName(fullName);
      } catch {
        // Checkout screens still handle missing email as a recoverable form error.
      }
    }

    hydrateSignedInUser();
    return () => {
      cancelled = true;
    };
  }, [email, setEmail, setName]);

  return (
    <main>
    <AnimatePresence mode="wait">
      {step === "quiz" && (
        <m.div key="quiz" {...fade(true)}>
          {!retakeMode && currentQuestionIndex === 0 && !quizStarted ? (
            <HomepageFunnel onStart={() => setQuizStarted(true)} />
          ) : (
            <QuizEngine />
          )}
        </m.div>
      )}

      {step === "loading" && (
        <m.div key="loading" {...fade()}>
          <LoadingScreen />
        </m.div>
      )}

      {step === "email" && (
        <m.div key="email" {...fade()}>
          <EmailScreen />
        </m.div>
      )}

      {step === "name" && (
        <m.div key="name" {...fade()}>
          <NameScreen />
        </m.div>
      )}

      {step === "chart" && (
        <m.div key="chart" {...fade()}>
          <ChartScreen />
        </m.div>
      )}

      {step === "paywall" && (
        <m.div key="paywall" {...fade()}>
          <PaywallScreen />
        </m.div>
      )}

      {step === "upsell" && (
        <m.div key="upsell" {...fade()}>
          <UpsellScreen />
        </m.div>
      )}

      {step === "subscription" && (
        <m.div key="subscription" {...fade()}>
          <SubscriptionScreen />
        </m.div>
      )}

      {step === "success" && (
        <m.div key="success" {...fade()}>
          <SuccessScreen />
        </m.div>
      )}
    </AnimatePresence>
    </main>
  );
}

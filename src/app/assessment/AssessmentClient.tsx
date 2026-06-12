"use client";

import dynamic                      from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m }  from "framer-motion";
import { ArrowRight }          from "lucide-react";
import { useQuizStore }             from "@/store/quizStore";
import type { FunnelStep }          from "@/types/quiz";
import { getPersistedQuizResultId } from "@/lib/quizResultId";
import { createClient }             from "@/lib/supabase/client";
import { QuizEngine }               from "@/components/quiz/QuizEngine";
import { FIRST_PARTY_EVENTS }       from "@/lib/analytics/events";
import { trackEvent }               from "@/lib/analytics/client";
import { FocusField }               from "@/components/v2/FocusField";
import { Magnetic }                 from "@/components/v2/Magnetic";
import { HudLabel, TelemetryChip, OrbitLoader, SignalRule } from "@/components/v2/primitives";

function ScreenSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <OrbitLoader />
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
    "Explain-It-To-Someone Script",
  ];

  const steps = [
    "Answer pattern-based questions",
    "Get your FocusRoute preview",
    "Unlock your full Brain Profile if it feels useful",
  ];

  return (
    <div style={{ position: "relative", minHeight: "100dvh", overflowX: "hidden", width: "100%", maxWidth: "100%" }}>
      {/* scattered attention field — the state the user arrives in; parts
          gently around the pointer */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <FocusField coherence={0.12} intensity={0.85} interactive />
      </div>
      <div className="v2-aurora" aria-hidden="true" />

      <section style={{ position: "relative", padding: "54px 20px 30px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", minWidth: 0 }}>
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <HudLabel tone="signal" style={{ marginBottom: 22 }}>
              FocusRoute — pattern mapping · free · 3 min
            </HudLabel>
          </m.div>
          <m.h1
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="v2-display"
            style={{
              fontSize: "clamp(36px, 10vw, 62px)",
              fontWeight: 550,
              lineHeight: 1.0,
              letterSpacing: "-0.028em",
              marginBottom: 20,
              overflowWrap: "break-word",
            }}
          >
            You&apos;re not lazy.
            <br />
            <em className="v2-text-signal" style={{ fontStyle: "italic" }}>
              Your focus system is overloaded.
            </em>
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 16,
              color: "var(--v2-ink-dim)",
              lineHeight: 1.7,
              marginBottom: 28,
              maxWidth: 540,
              overflowWrap: "break-word",
            }}
          >
            Take the free 3-minute FocusRoute assessment to map your focus patterns,
            friction points, and best next step.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <Magnetic style={{ width: "100%", maxWidth: 380 }}>
              <button
                type="button"
                onClick={onStart}
                className="v2-cta"
                style={{ width: "100%", minHeight: 60, fontSize: 16, animation: "v2-pulse-ring 2.6s ease-out infinite" }}
              >
                Find My Focus Pattern
                <ArrowRight size={17} strokeWidth={2.6} />
              </button>
            </Magnetic>
          </m.div>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "9px 20px", marginTop: 20 }}
          >
            <TelemetryChip>Free</TelemetryChip>
            <TelemetryChip>3 minutes</TelemetryChip>
            <TelemetryChip>Private results</TelemetryChip>
            <TelemetryChip color="var(--v2-ink-faint)">Not a diagnosis</TelemetryChip>
          </m.div>
        </div>
      </section>

      <section style={{ position: "relative", padding: "16px 20px 30px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 10, minWidth: 0 }}>
          <HudLabel style={{ marginBottom: 4 }}>Signal readings — tap what sounds like you</HudLabel>
          {recognition.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                trackEvent(FIRST_PARTY_EVENTS.recognitionCardClicked, {
                  metadata: { card_label: item, cta_location: "assessment_entry" },
                });
                onStart();
              }}
              aria-label={`${item} Start the FocusRoute assessment`}
              className="v2-panel"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "16px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minWidth: 0,
                color: "var(--v2-ink)",
                transition: "border-color 0.25s, transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(163,178,255,0.42)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--v2-line)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span className="v2-hud" aria-hidden="true" style={{ color: "var(--v2-signal-2)", fontSize: 10, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.35, minWidth: 0, overflowWrap: "break-word" }}>
                  {item}
                </span>
              </span>
              <span
                aria-hidden="true"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid rgba(163,178,255,0.35)",
                  color: "var(--v2-signal-2)",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section style={{ position: "relative", padding: "26px 20px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", minWidth: 0 }}>
          <HudLabel style={{ marginBottom: 12 }}>What you&apos;ll get</HudLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 10 }}>
            {outcomes.map((item) => (
              <div
                key={item}
                className="v2-panel"
                style={{ borderRadius: 14, padding: "14px 14px", minWidth: 0 }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.4, overflowWrap: "break-word" }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: "relative", padding: "26px 20px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", minWidth: 0 }}>
          <HudLabel style={{ marginBottom: 16 }}>How it works</HudLabel>
          <div style={{ display: "grid", gap: 14 }}>
            {steps.map((item, index) => (
              <div key={item} style={{ display: "grid", gridTemplateColumns: "34px minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    border: "1px solid rgba(163,178,255,0.35)",
                    background: "rgba(124,138,255,0.08)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--v2-signal-2)",
                    fontFamily: "var(--v2-font-mono)",
                    fontSize: 12,
                  }}
                >
                  {index + 1}
                </span>
                <p style={{ fontSize: 14.5, color: "var(--v2-ink-dim)", lineHeight: 1.6, paddingTop: 6, overflowWrap: "break-word" }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: "relative", padding: "26px 20px 44px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", minWidth: 0, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <SignalRule style={{ marginBottom: 24 }} />
          <p style={{ fontSize: 13, color: "var(--v2-ink-faint)", lineHeight: 1.7, marginBottom: 22, overflowWrap: "break-word" }}>
            Your results are private. FocusRoute is built for self-understanding and
            productivity support. It is not a diagnosis, medical treatment, or a
            substitute for professional care.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="v2-cta"
            style={{ width: "100%", minHeight: 56, fontSize: 15 }}
          >
            Find My Focus Pattern
            <ArrowRight size={16} strokeWidth={2.6} />
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

interface AssessmentClientProps {
  autoStartQuiz?: boolean;
  paidAutoStart?: boolean;
}

export default function AssessmentClient({
  autoStartQuiz = false,
  paidAutoStart = false,
}: AssessmentClientProps) {
  const step = useQuizStore((s) => s.currentStep);
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
  const retakeMode = useQuizStore((s) => s.retakeMode);
  const email = useQuizStore((s) => s.email);
  const setQuizResultId = useQuizStore((s) => s.setQuizResultId);
  const setStep = useQuizStore((s) => s.setStep);
  const setEmail = useQuizStore((s) => s.setEmail);
  const setName = useQuizStore((s) => s.setName);
  const [quizStarted, setQuizStarted] = useState(autoStartQuiz);
  const autoStartTracked = useRef(false);

  function startQuiz() {
    trackEvent(FIRST_PARTY_EVENTS.assessmentStarted, {
      metadata: { cta_location: "assessment_entry" },
    });
    setQuizStarted(true);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  useEffect(() => {
    if (!autoStartQuiz || step !== "quiz" || currentQuestionIndex !== 0 || retakeMode) return;
    if (autoStartTracked.current) return;
    autoStartTracked.current = true;

    trackEvent(FIRST_PARTY_EVENTS.assessmentStarted, {
      metadata: { cta_location: "assessment_entry", auto_start: true },
    });
    if (paidAutoStart) {
      trackEvent(FIRST_PARTY_EVENTS.paidAutoStarted, {
        metadata: { auto_start: true },
      });
    }
  }, [autoStartQuiz, currentQuestionIndex, paidAutoStart, retakeMode, step]);

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
    <main className="v2-screen v2-grain" style={{ overflowX: "hidden" }}>
    <AnimatePresence mode="wait">
      {step === "quiz" && (
        <m.div key="quiz" {...fade(true)}>
          {!retakeMode && currentQuestionIndex === 0 && !quizStarted ? (
            <HomepageFunnel onStart={startQuiz} />
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

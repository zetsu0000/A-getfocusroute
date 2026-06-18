"use client";

import dynamic                      from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m }  from "framer-motion";
import { useQuizStore }             from "@/store/quizStore";
import type { FunnelStep }          from "@/types/quiz";
import { getPersistedQuizResultId, setPersistedQuizResultId } from "@/lib/quizResultId";
import { createClient }             from "@/lib/supabase/client";
import { QuizEngine }               from "@/components/quiz/QuizEngine";
import { FIRST_PARTY_EVENTS }       from "@/lib/analytics/events";
import { trackEvent }               from "@/lib/analytics/client";
import { OrbitLoader }              from "@/components/v2/primitives";
import { useFunnelTheme, ThemeToggleButton } from "@/components/v2/FunnelThemeProvider";
import { shouldTrackAssessmentStart } from "@/lib/assessment/entry";
import {
  STEP_ORDER,
  createSharedPaymentVerifier,
  isFunnelStep,
  isGuardedEntryStep,
  planFunnelEntry,
  pollVerifyPayment,
  stripFunnelEntryParams,
  type VerifyPaymentRequest,
  type VerifyVerdict,
} from "@/lib/payment-verification";
import {
  parseUpgradeHandoffResponse,
  readUpgradeNeed,
  type UpgradeHandoffDecision,
  type UpgradeNeed,
} from "@/lib/dashboard/upgrade-handoff";

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
const SubscriptionScreen = dynamic(() => import("@/components/subscription/SubscriptionPlansScreen").then(m => ({ default: m.SubscriptionPlansScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });
const SuccessScreen      = dynamic(() => import("@/components/success/SuccessScreen").then(m => ({ default: m.SuccessScreen })), { ssr: false, loading: () => <ScreenSkeleton /> });

function readEntryStep(): FunnelStep | null {
  if (typeof window === "undefined") return null;
  const step = new URLSearchParams(window.location.search).get("step");
  return isFunnelStep(step) && isGuardedEntryStep(step) ? step : null;
}

function metadataName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const GATE_NOTICE_FAILED =
  "Your payment didn't go through, so nothing was unlocked. You can try again below — no charge was completed.";
const GATE_NOTICE_PENDING =
  "Your payment is still processing. Check back in a moment — your access unlocks the instant it completes.";

const verifyPaymentIntent = createSharedPaymentVerifier(
  (request: VerifyPaymentRequest) => pollVerifyPayment(request),
);

function cleanPaymentReturnUrl() {
  if (typeof window === "undefined") return;
  const search = stripFunnelEntryParams(window.location.search);
  const next = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

function afterEffect(callback: () => void) {
  void Promise.resolve().then(callback);
}

/* Asks the authenticated handoff endpoint to restore the user's real funnel
   context for a /dashboard/upgrade CTA. The request carries no payment data and
   the endpoint makes no Stripe call — opening a step is navigation only. Any
   failure is treated as a recoverable denial, never silent permission. */
async function fetchUpgradeHandoff(
  need: UpgradeNeed,
): Promise<UpgradeHandoffDecision> {
  try {
    const res = await fetch(
      `/api/assessment/upgrade-handoff?need=${encodeURIComponent(need)}`,
      { headers: { Accept: "application/json" } },
    );
    return parseUpgradeHandoffResponse(await res.json());
  } catch {
    return { authorized: false, reason: "error" };
  }
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
  paidAutoStart?: boolean;
  hasEntryStep?: boolean;
  hasUpgradeHandoff?: boolean;
}

export default function AssessmentClient({
  paidAutoStart = false,
  hasEntryStep = false,
  hasUpgradeHandoff = false,
}: AssessmentClientProps) {
  const step = useQuizStore((s) => s.currentStep);
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
  const retakeMode = useQuizStore((s) => s.retakeMode);
  const email = useQuizStore((s) => s.email);
  const setQuizResultId = useQuizStore((s) => s.setQuizResultId);
  const setStep = useQuizStore((s) => s.setStep);
  const setEmail = useQuizStore((s) => s.setEmail);
  const setName = useQuizStore((s) => s.setName);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);
  const { theme } = useFunnelTheme();
  const screenClass = `${theme === "light" ? "v2-light " : ""}v2-screen v2-grain`;
  const assessmentStartTracked = useRef(false);
  const [gateMode, setGateMode] = useState<
    "checking" | "ready" | "verifying" | "recovery"
  >(hasEntryStep || hasUpgradeHandoff ? "checking" : "ready");
  const [gateNotice, setGateNotice] = useState<string | null>(null);

  /* The redundant intro screen is gone: a fresh assessment entry lands directly
     on Q1, so `assessment_started` is now the first paint of the first quiz
     question rather than a button click. Fire it exactly once — guarded so a
     Stripe redirect return (gate not yet ready), a resumed later question, or a
     retake never counts as a fresh start. Paid traffic additionally fires
     paid_auto_started, keeping organic vs paid distinguishable. */
  useEffect(() => {
    if (
      !shouldTrackAssessmentStart({
        gateReady: gateMode === "ready",
        step,
        currentQuestionIndex,
        retakeMode,
        alreadyTracked: assessmentStartTracked.current,
      })
    ) {
      return;
    }
    assessmentStartTracked.current = true;

    trackEvent(FIRST_PARTY_EVENTS.assessmentStarted, {
      metadata: { cta_location: "assessment_entry", auto_start: true },
    });
    if (paidAutoStart) {
      trackEvent(FIRST_PARTY_EVENTS.paidAutoStarted, {
        metadata: { auto_start: true },
      });
    }
  }, [gateMode, currentQuestionIndex, paidAutoStart, retakeMode, step]);

  useEffect(() => {
    const id = getPersistedQuizResultId();
    if (id) {
      setQuizResultId(id);
    }
  }, [setQuizResultId]);

  /* Funnel entry gate (production audit): a ?step= query parameter never
     advances the funnel by itself. A guarded step (paywall/upsell/subscription/
     success) is honored only when the persisted store already earned it, or —
     for post-purchase steps — a Stripe redirect return is verified server-side.
     Everything else is ignored and the user stays at their real position
     (a fresh store is Q1). The decision is computed by the pure planFunnelEntry
     helper so the behavior stays unit-testable. */
  useEffect(() => {
    let active = true;
    const finish = () => {
      active = false;
    };
    const runIfActive = (callback: () => void) => {
      afterEffect(() => {
        if (active) callback();
      });
    };

    /* Authenticated dashboard upgrade handoff (?upgrade=…) takes precedence: a
       separate, server-verified channel that restores the user's real funnel
       context and opens the requested step. It never relaxes gateFunnelEntry —
       login or a query parameter alone is rejected by the endpoint, and an
       unrestorable result lands on an explicit assessment-required recovery
       (never a silent Q1 drop). */
    const upgradeNeed = readUpgradeNeed(window.location.search);
    if (upgradeNeed) {
      runIfActive(() => setGateMode("checking"));
      void fetchUpgradeHandoff(upgradeNeed).then((decision) => {
        if (!active) return;
        cleanPaymentReturnUrl();
        if (decision.authorized) {
          useQuizStore.setState({
            email: decision.email,
            name: decision.name,
            answers: decision.answers,
            quizResultId: decision.quizResultId,
            currentStep: decision.step,
          });
          if (decision.quizResultId) {
            setPersistedQuizResultId(decision.quizResultId);
          }
          setGateMode("ready");
          return;
        }
        if (decision.redirectTo) {
          window.location.assign(decision.redirectTo);
          return;
        }
        setGateMode("recovery");
      });
      return finish;
    }

    const plan = planFunnelEntry(
      window.location.search,
      useQuizStore.getState().currentStep,
    );

    if (plan.kind === "ready") {
      runIfActive(() => setGateMode("ready"));
      return finish;
    }

    if (plan.kind === "enter") {
      // Earned in-app refresh/re-entry: drop the query string and advance.
      runIfActive(() => {
        cleanPaymentReturnUrl();
        setStep(plan.step);
        setGateMode("ready");
      });
      return finish;
    }

    if (plan.kind === "ignore") {
      // Not earned and no payment evidence: drop the query string and keep the
      // legitimate persisted funnel position. The guarded screen never renders.
      runIfActive(() => {
        cleanPaymentReturnUrl();
        setGateMode("ready");
      });
      return finish;
    }

    runIfActive(() => setGateMode("verifying"));
    void verifyPaymentIntent({
      paymentIntentId: plan.paymentIntentId,
      targetStep: plan.step,
      subscriptionId: plan.subscriptionId,
    }).then((verdict: VerifyVerdict) => {
      if (!active) return;
      cleanPaymentReturnUrl();
      if (verdict === "succeeded") {
        setStep(plan.step);
        setGateMode("ready");
        return;
      }
      setGateNotice(verdict === "processing" ? GATE_NOTICE_PENDING : GATE_NOTICE_FAILED);
      // Recoverable landing: keep an honest store position, otherwise offer
      // the purchase again. Never success. Subscription-first funnel: the
      // subscription is the primary paywall, so an unverified return lands back
      // on it rather than the retired one-time paywall step.
      const current = useQuizStore.getState().currentStep;
      if ((STEP_ORDER[current] ?? 0) < STEP_ORDER.subscription) {
        setStep("subscription");
      }
      setGateMode("ready");
    });
    return finish;
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

  if (gateMode === "recovery") {
    return (
      <main className={screenClass} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "32px 20px", textAlign: "center" }}>
      <ThemeToggleButton />
        <p className="v2-hud" style={{ color: "var(--v2-signal-2)" }}>One step first</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--v2-gold-bright)", maxWidth: 420, lineHeight: 1.3 }}>
          Finish your assessment to unlock this
        </h1>
        <p style={{ fontSize: 14, color: "var(--v2-ink-faint)", maxWidth: 360, lineHeight: 1.6 }}>
          Your plan is built from your assessment answers. It only takes about 2 minutes — your access then syncs to your account automatically.
        </p>
        <button
          type="button"
          onClick={() => {
            cleanPaymentReturnUrl();
            resetQuiz();
            setGateMode("ready");
          }}
          className="v2-cta v2-cta-gold"
          style={{ marginTop: 6 }}
        >
          Take the assessment
        </button>
      </main>
    );
  }

  if (gateMode !== "ready") {
    return (
      <main className={screenClass} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <ThemeToggleButton />
        <OrbitLoader />
        <p className="v2-hud" style={{ color: "var(--v2-signal-2)" }}>{gateMode === "verifying" ? "Verifying payment" : "Loading"}</p>
        <p style={{ fontSize: 13, color: "var(--v2-ink-faint)", maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>
          {gateMode === "verifying"
            ? "Confirming your payment securely — this only takes a moment."
            : "Preparing your assessment."}
        </p>
      </main>
    );
  }

  return (
    <main className={screenClass} style={{ overflowX: "hidden" }}>
    {/* On the subscription checkout the toggle is pinned to the opening band so
        it can never float over plan cards, summary, social proof, Stripe or the
        CTA; every other step keeps the scroll-aware auto-hide. */}
    <ThemeToggleButton pinTopOnly={step === "subscription"} />
    {gateNotice && (
      <div
        role="status"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          padding: "12px 16px",
          background: theme === "light" ? "rgba(252, 247, 235, 0.96)" : "rgba(20, 16, 10, 0.94)",
          borderBottom: theme === "light" ? "1px solid rgba(154,122,46,0.32)" : "1px solid rgba(217,188,127,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <p style={{ fontSize: 13, color: "var(--v2-gold-bright)", lineHeight: 1.5, maxWidth: 560 }}>
          {gateNotice}
        </p>
        <button
          type="button"
          onClick={() => setGateNotice(null)}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", color: "var(--v2-ink-faint)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    )}
    <AnimatePresence mode="wait">
      {step === "quiz" && (
        <m.div key="quiz" {...fade(true)}>
          <QuizEngine />
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

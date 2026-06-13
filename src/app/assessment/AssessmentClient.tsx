"use client";

import dynamic                      from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m }  from "framer-motion";
import { useQuizStore }             from "@/store/quizStore";
import type { FunnelStep }          from "@/types/quiz";
import { getPersistedQuizResultId } from "@/lib/quizResultId";
import { createClient }             from "@/lib/supabase/client";
import { QuizEngine }               from "@/components/quiz/QuizEngine";
import { FIRST_PARTY_EVENTS }       from "@/lib/analytics/events";
import { trackEvent }               from "@/lib/analytics/client";
import { OrbitLoader }              from "@/components/v2/primitives";
import { shouldTrackAssessmentStart } from "@/lib/assessment/entry";
import {
  STEP_ORDER,
  createSharedPaymentVerifier,
  gatePostPurchaseEntry,
  isPaymentIntentId,
  isSubscriptionId,
  pollVerifyPayment,
  type VerifyPaymentRequest,
  type VerifyVerdict,
} from "@/lib/payment-verification";

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

const GATE_NOTICE_FAILED =
  "Your payment didn't go through, so nothing was unlocked. You can try again below — no charge was completed.";
const GATE_NOTICE_PENDING =
  "Your payment is still processing. Check back in a moment — your access unlocks the instant it completes.";

const verifyPaymentIntent = createSharedPaymentVerifier(
  (request: VerifyPaymentRequest) => pollVerifyPayment(request),
);

function cleanPaymentReturnUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of [
    "step",
    "payment_intent",
    "payment_intent_client_secret",
    "redirect_status",
    "subscription_id",
  ]) {
    url.searchParams.delete(key);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", next);
}

function afterEffect(callback: () => void) {
  void Promise.resolve().then(callback);
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
}

export default function AssessmentClient({
  paidAutoStart = false,
  hasEntryStep = false,
}: AssessmentClientProps) {
  const step = useQuizStore((s) => s.currentStep);
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
  const retakeMode = useQuizStore((s) => s.retakeMode);
  const email = useQuizStore((s) => s.email);
  const setQuizResultId = useQuizStore((s) => s.setQuizResultId);
  const setStep = useQuizStore((s) => s.setStep);
  const setEmail = useQuizStore((s) => s.setEmail);
  const setName = useQuizStore((s) => s.setName);
  const assessmentStartTracked = useRef(false);
  const [gateMode, setGateMode] = useState<"checking" | "ready" | "verifying">(
    hasEntryStep ? "checking" : "ready",
  );
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

  /* Post-purchase entry gate (production audit): ?step= alone never shows
     success/upsell/subscription. Advancement needs either a persisted store
     position that already earned the step, or a server-verified Stripe
     redirect return. Everything else lands in a calm recoverable state. */
  useEffect(() => {
    let active = true;
    const runIfActive = (callback: () => void) => {
      afterEffect(() => {
        if (active) callback();
      });
    };

    const entryStep = readEntryStep();
    if (!entryStep) {
      runIfActive(() => setGateMode("ready"));
      return () => {
        active = false;
      };
    }

    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get("payment_intent") ?? "";
    const rawSubscriptionId = params.get("subscription_id");
    const subscriptionId = isSubscriptionId(rawSubscriptionId) ? rawSubscriptionId : null;
    const storeStep = useQuizStore.getState().currentStep;
    const decision = gatePostPurchaseEntry(
      entryStep,
      storeStep,
      isPaymentIntentId(paymentIntentId),
    );

    if (decision === "allow") {
      runIfActive(() => {
        cleanPaymentReturnUrl();
        setStep(entryStep);
        setGateMode("ready");
      });
      return () => {
        active = false;
      };
    }
    if (decision === "deny") {
      // No purchase evidence: ignore the query string entirely.
      runIfActive(() => {
        cleanPaymentReturnUrl();
        setGateMode("ready");
      });
      return () => {
        active = false;
      };
    }

    runIfActive(() => setGateMode("verifying"));
    void verifyPaymentIntent({
      paymentIntentId,
      targetStep: entryStep,
      subscriptionId,
    }).then((verdict: VerifyVerdict) => {
      if (!active) return;
      cleanPaymentReturnUrl();
      if (verdict === "succeeded") {
        setStep(entryStep);
        setGateMode("ready");
        return;
      }
      setGateNotice(verdict === "processing" ? GATE_NOTICE_PENDING : GATE_NOTICE_FAILED);
      // Recoverable landing: keep an honest store position, otherwise offer
      // the purchase again. Never success.
      const current = useQuizStore.getState().currentStep;
      if ((STEP_ORDER[current] ?? 0) < STEP_ORDER.paywall) {
        setStep("paywall");
      }
      setGateMode("ready");
    });
    return () => {
      active = false;
    };
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

  if (gateMode !== "ready") {
    return (
      <main className="v2-screen v2-grain" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
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
    <main className="v2-screen v2-grain" style={{ overflowX: "hidden" }}>
    {gateNotice && (
      <div
        role="status"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          padding: "12px 16px",
          background: "rgba(20, 16, 10, 0.94)",
          borderBottom: "1px solid rgba(217,188,127,0.4)",
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

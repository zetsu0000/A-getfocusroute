"use client";

import dynamic                 from "next/dynamic";
import { AnimatePresence, m }  from "framer-motion";
import { useQuizStore }        from "@/store/quizStore";
import { QuizEngine }          from "@/components/quiz/QuizEngine";

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

  return (
    <main>
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

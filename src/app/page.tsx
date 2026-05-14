"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useQuizStore }             from "@/store/quizStore";
import { QuizEngine }               from "@/components/quiz/QuizEngine";
import { LoadingScreen }            from "@/components/loading/LoadingScreen";
import { EmailScreen }              from "@/components/email/EmailScreen";
import { NameScreen }               from "@/components/name/NameScreen";
import { ChartScreen }              from "@/components/chart/ChartScreen";
import { PaywallScreen }            from "@/components/paywall/PaywallScreen";
import { UpsellScreen }             from "@/components/upsell/UpsellScreen";
import { SubscriptionScreen }       from "@/components/subscription/SubscriptionScreen";
import { SuccessScreen }            from "@/components/success/SuccessScreen";

const fade = (key: string) => ({
  key,
  initial:    { opacity: 0, x: 30  } as const,
  animate:    { opacity: 1, x: 0   } as const,
  exit:       { opacity: 0, x: -30 } as const,
  transition: { duration: 0.26 },
});

export default function Home() {
  const step = useQuizStore((s) => s.currentStep);

  return (
    <AnimatePresence mode="wait">
      {step === "quiz" && (
        <motion.div {...fade("quiz")}>
          <QuizEngine />
        </motion.div>
      )}

      {step === "loading" && (
        <motion.div {...fade("loading")}>
          <LoadingScreen />
        </motion.div>
      )}

      {step === "email" && (
        <motion.div {...fade("email")}>
          <EmailScreen />
        </motion.div>
      )}

      {step === "name" && (
        <motion.div {...fade("name")}>
          <NameScreen />
        </motion.div>
      )}

      {step === "chart" && (
        <motion.div {...fade("chart")}>
          <ChartScreen />
        </motion.div>
      )}

      {step === "paywall" && (
        <motion.div {...fade("paywall")}>
          <PaywallScreen />
        </motion.div>
      )}

      {step === "upsell" && (
        <motion.div {...fade("upsell")}>
          <UpsellScreen />
        </motion.div>
      )}

      {step === "subscription" && (
        <motion.div {...fade("subscription")}>
          <SubscriptionScreen />
        </motion.div>
      )}

      {step === "success" && (
        <motion.div {...fade("success")}>
          <SuccessScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

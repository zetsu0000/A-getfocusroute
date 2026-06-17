"use client";

import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";
import { InfocardV2 } from "@/components/quiz/infocards";

/**
 * InfoCard — the between-block narrative interstitial. Presentational only:
 * `submitInfo` never writes to `answers`, so infocards never affect scoring.
 * The five distinct card grammars live in `infocards.tsx`; this is the funnel
 * mount point that supplies the continue handler.
 */
export function InfoCard({ question }: { question: QuizQuestion }) {
  const submitInfo = useQuizStore((s) => s.submitInfo);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        minHeight: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <InfocardV2 question={question} onContinue={() => submitInfo()} />
    </div>
  );
}

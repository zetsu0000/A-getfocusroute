"use client";

import { m } from "framer-motion";
import { questions, progressQuestions } from "@/data/questions";

interface ProgressBarProps { currentIndex: number }

export function ProgressBar({ currentIndex }: ProgressBarProps) {
  const answered = questions
    .slice(0, currentIndex + 1)
    .filter((q) => q.inputType !== "info").length;

  const total    = progressQuestions.length;
  const progress = Math.round((answered / total) * 100);

  return (
    <div className="flex-1 rounded-full overflow-hidden"
      style={{ height: 8, background: "var(--color-border)" }}
    >
      <m.div
        className="h-full rounded-full"
        style={{
          background: "linear-gradient(90deg, var(--color-progress-start), var(--color-progress-end))",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

"use client";

import { m } from "framer-motion";
import { questions, progressQuestions } from "@/data/questions";

interface ProgressBarProps { currentIndex: number }

/**
 * V2 route-line progress: a dashed route track that fills with the luminous
 * signal gradient, led by a glowing head node — progress as a path being
 * traced, not a loading bar.
 */
export function ProgressBar({ currentIndex }: ProgressBarProps) {
  const answered = questions
    .slice(0, currentIndex + 1)
    .filter((q) => q.inputType !== "info").length;

  const total    = progressQuestions.length;
  const progress = Math.round((answered / total) * 100);

  return (
    <div
      className="flex-1"
      style={{ position: "relative", height: 14, display: "flex", alignItems: "center" }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Assessment progress"
    >
      {/* dashed route track */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "6px 0",
          borderRadius: 999,
          background:
            "repeating-linear-gradient(90deg, rgba(163,178,255,0.28) 0 7px, transparent 7px 14px)",
          opacity: 0.5,
          height: 2,
          top: "50%",
          marginTop: -1,
        }}
      />
      {/* traced signal */}
      <m.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          height: 3,
          borderRadius: 999,
          background: "var(--v2-grad-signal)",
          boxShadow: "0 0 12px rgba(124,138,255,0.55)",
        }}
      >
        {/* head node */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -5,
            top: "50%",
            transform: "translateY(-50%)",
            width: 9,
            height: 9,
            borderRadius: 999,
            background: "var(--v2-signal-2)",
            boxShadow: "0 0 10px var(--v2-signal-2), 0 0 22px rgba(155,232,255,0.5)",
          }}
        />
      </m.div>
    </div>
  );
}

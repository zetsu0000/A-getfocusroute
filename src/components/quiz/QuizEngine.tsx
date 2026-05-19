"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { questions } from "@/data/questions";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

// InfoCard only renders for `info`-type questions (first one appears after Q10),
// and ScaleQuestion only renders for `scale`-type questions (first one at Q11).
// Defer both so the landing-page chunk doesn't carry them.
const ScaleQuestion = dynamic(
  () => import("./ScaleQuestion").then(m => ({ default: m.ScaleQuestion })),
  { ssr: false },
);
const InfoCard = dynamic(
  () => import("./InfoCard").then(m => ({ default: m.InfoCard })),
  { ssr: false },
);

const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function QuizEngine() {
  const { currentQuestionIndex, selectedOptions, submitAnswer, goBack } = useQuizStore();
  const [direction, setDirection] = useState(1);
  const prevIndex = useRef(currentQuestionIndex);

  const question = questions[currentQuestionIndex];
  const isInfo = question.inputType === "info";
  const isScale = question.inputType === "scale";
  const isMultiple = question.inputType === "multiple";

  /* Numeric progress indicator */
  const answeredCount = questions
    .slice(0, currentQuestionIndex + 1)
    .filter((q) => q.inputType !== "info").length;
  const totalCount = questions.filter((q) => q.inputType !== "info").length;

  // Slide direction follows question index; syncing in an effect avoids reading refs during render (react-hooks/refs).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- AnimatePresence direction tracks zustand index delta
    setDirection(currentQuestionIndex >= prevIndex.current ? 1 : -1);
    prevIndex.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    /* Scale handles its own advance */
    if (isScale) return;
    if (!isMultiple && !isInfo && selectedOptions.length === 1) {
      const t = setTimeout(() => submitAnswer(), 380);
      return () => clearTimeout(t);
    }
  }, [selectedOptions, isMultiple, isInfo, isScale, submitAnswer]);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 w-full"
        style={{ padding: "20px 20px 14px" }}
      >
        <m.button
          onClick={currentQuestionIndex > 0 ? goBack : undefined}
          aria-hidden={currentQuestionIndex === 0}
          tabIndex={currentQuestionIndex === 0 ? -1 : 0}
          whileTap={{ scale: 0.88 }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            color: "var(--color-text-muted)",
            background: "transparent",
            border: "none",
            cursor: currentQuestionIndex > 0 ? "pointer" : "default",
            pointerEvents: currentQuestionIndex > 0 ? "auto" : "none",
            transition: "background 0.15s, color 0.15s",
            visibility: currentQuestionIndex > 0 ? "visible" : "hidden",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card)";
            (e.currentTarget as HTMLElement).style.color      = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color      = "var(--color-text-muted)";
          }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </m.button>

        <div className="flex-1 flex flex-col gap-1">
          {!isInfo && <ProgressBar currentIndex={currentQuestionIndex} />}
          {!isInfo && (
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textAlign: "right", letterSpacing: "0.04em" }}>
              {answeredCount} / {totalCount}
            </p>
          )}
        </div>
      </div>

      {/* ── Slide stage ────────────────────────────────────── */}
      <div className="flex-1" style={{ position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={question.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x:       { type: "spring", stiffness: 320, damping: 32 },
              opacity: { duration: 0.18 },
            }}
            style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}
          >
            {isInfo    ? <InfoCard       question={question} /> :
             isScale   ? <ScaleQuestion  question={question} /> :
                         <QuestionCard   question={question} />
            }
          </m.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

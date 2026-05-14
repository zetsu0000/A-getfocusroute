"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { questions } from "@/data/questions";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";
import { ScaleQuestion } from "./ScaleQuestion";
import { InfoCard } from "./InfoCard";
import { GenderLanding } from "./GenderLanding";

const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function QuizEngine() {
  const { currentQuestionIndex, selectedOptions, submitAnswer, goBack } = useQuizStore();
  const [direction, setDirection] = useState(1);
  const prevIndex = useRef(currentQuestionIndex);

  const question   = questions[currentQuestionIndex];
  const isInfo     = question.inputType === "info";
  const isScale    = question.inputType === "scale";
  const isMultiple = question.inputType === "multiple";
  const isLanding  = currentQuestionIndex === 0;   // gender question → special landing

  useEffect(() => {
    setDirection(currentQuestionIndex >= prevIndex.current ? 1 : -1);
    prevIndex.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    /* Landing + Scale handle their own advance */
    if (isLanding || isScale) return;
    if (!isMultiple && !isInfo && selectedOptions.length === 1) {
      const t = setTimeout(() => submitAnswer(), 380);
      return () => clearTimeout(t);
    }
  }, [selectedOptions, isMultiple, isInfo, isScale, isLanding, submitAnswer]);

  /* Render the special landing screen for the first (gender) question */
  if (isLanding) return <GenderLanding />;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 w-full"
        style={{ padding: "20px 20px 14px" }}
      >
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.88 }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            color: "var(--color-text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card)";
            (e.currentTarget as HTMLElement).style.color      = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color      = "var(--color-text-muted)";
          }}
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </motion.button>

        <div className="flex-1">
          {!isInfo && <ProgressBar currentIndex={currentQuestionIndex} />}
        </div>
      </div>

      {/* ── Slide stage ────────────────────────────────────── */}
      <div className="flex-1" style={{ position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
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
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

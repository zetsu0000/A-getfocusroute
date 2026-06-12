"use client";

import { m, AnimatePresence } from "framer-motion";
import { QuizQuestion } from "@/types/quiz";
import { OptionButton } from "./OptionButton";
import { useQuizStore } from "@/store/quizStore";

interface QuestionCardProps {
  question: QuizQuestion;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const { selectedOptions, selectOption, submitAnswer } = useQuizStore();
  const isMultiple  = question.inputType === "multiple";
  const canContinue = selectedOptions.length > 0;

  return (
    /* Balanced full-height layout for the first screen and later questions. */
    <div style={{
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      overflowY: "auto",
      padding: "clamp(24px, 5vh, 44px) 0 clamp(32px, 6vh, 52px)",
      gap: "clamp(24px, 5vh, 42px)",
    }}>

      {/* ── Title — top, centered, editorial serif ───────────── */}
      <div style={{
        padding: "0 24px",
        textAlign: "center",
        maxWidth: 560,
        margin: "0 auto",
        width: "100%",
      }}>
        <m.h2
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="v2-display"
          style={{
            fontSize: "clamp(23px, 6vw, 31px)",
            fontWeight: 550,
            lineHeight: 1.18,
            letterSpacing: "-0.022em",
          }}
        >
          {question.question}
        </m.h2>
        {question.subtitle && (
          <p style={{
            fontSize: 13,
            color: "var(--v2-ink-faint)",
            marginTop: 8,
            lineHeight: 1.5,
          }}>
            {question.subtitle}
          </p>
        )}
      </div>

      <div style={{
        padding: "0 20px",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}>
        {question.options.map((option, i) => (
          <m.div
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.045, duration: 0.2 }}
          >
            <OptionButton
              option={option}
              isSelected={selectedOptions.includes(option.id)}
              inputType={question.inputType as "single" | "multiple"}
              onClick={() =>
                selectOption(option.id, question.inputType as "single" | "multiple")
              }
            />
          </m.div>
        ))}

        {/* ── Continue button (multiple-choice only) ─────────── */}
        <AnimatePresence>
          {isMultiple && (
            <m.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={() => canContinue && submitAnswer()}
              disabled={!canContinue}
              className={canContinue ? "v2-cta" : undefined}
              style={{
                width: "100%",
                marginTop: 6,
                minHeight: 56,
                padding: "16px 24px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 800,
                cursor: canContinue ? "pointer" : "not-allowed",
                ...(canContinue
                  ? {}
                  : {
                      background: "rgba(148,163,255,0.05)",
                      border: "1px solid var(--v2-line)",
                      color: "var(--v2-ink-ghost)",
                    }),
              }}
            >
              Continue
            </m.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

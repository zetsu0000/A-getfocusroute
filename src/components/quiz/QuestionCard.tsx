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

      {/* ── Title — top, centered, dark ──────────────────────── */}
      <div style={{
        padding: "0 24px",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
        width: "100%",
      }}>
        <h2 style={{
          fontSize: "clamp(18px, 4.5vw, 22px)",
          fontWeight: 700,
          color: "var(--color-text)",
          lineHeight: 1.28,
          letterSpacing: "-0.02em",
        }}>
          {question.question}
        </h2>
        {question.subtitle && (
          <p style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            marginTop: 6,
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
        gap: 8,
      }}>
        {question.options.map((option, i) => (
          <m.div
            key={option.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.18 }}
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
              style={{
                width: "100%",
                marginTop: 4,
                padding: "16px 24px",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: canContinue ? "pointer" : "not-allowed",
                transition: "background 0.18s, box-shadow 0.18s",
                ...(canContinue
                  ? {
                      background: "var(--color-accent)",
                      color: "#ffffff",
                      boxShadow: "var(--shadow-btn-accent)",
                    }
                  : {
                      background: "var(--color-border)",
                      color: "var(--color-text-muted)",
                    }),
              }}
            >
              Record Answer
            </m.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

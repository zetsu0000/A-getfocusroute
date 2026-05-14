"use client";

import { motion, AnimatePresence } from "framer-motion";
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
    /* Full-height flex column: title at top, spacer, options at bottom */
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>

      {/* ── Title — top, centered, dark ──────────────────────── */}
      <div style={{
        padding: "28px 24px 0",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
        width: "100%",
      }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          color: "var(--color-text)",
          lineHeight: 1.28,
          letterSpacing: "-0.01em",
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

      {/* ── Spacer — pushes options to the bottom ────────────── */}
      <div style={{ flex: 1, minHeight: 32 }} />

      {/* ── Options + optional Continue — bottom aligned ─────── */}
      <div style={{
        padding: "0 20px 40px",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {question.options.map((option, i) => (
          <motion.div
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
          </motion.div>
        ))}

        {/* ── Continue button (multiple-choice only) ─────────── */}
        <AnimatePresence>
          {isMultiple && (
            <motion.button
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
                      background: "var(--color-primary)",
                      color: "#ffffff",
                      boxShadow: "var(--shadow-btn-primary)",
                    }
                  : {
                      background: "var(--color-border)",
                      color: "var(--color-text-muted)",
                    }),
              }}
            >
              Continue
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

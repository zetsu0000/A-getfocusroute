"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";

interface ScaleQuestionProps {
  question: QuizQuestion;
}

const SCALE = [
  { id: "1", label: "1", desc: "Not at all" },
  { id: "2", label: "2", desc: "Rarely"     },
  { id: "3", label: "3", desc: "Sometimes"  },
  { id: "4", label: "4", desc: "Often"      },
  { id: "5", label: "5", desc: "Always"     },
];

export function ScaleQuestion({ question }: ScaleQuestionProps) {
  const { selectOption, submitAnswer } = useQuizStore();
  const [chosen, setChosen] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (chosen) return;
    setChosen(id);
    selectOption(id, "single");
    setTimeout(() => submitAnswer(), 420);
  };

  return (
    /* Same layout as QuestionCard: title top, spacer, content bottom */
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* ── Title ──────────────────────────────────────────────── */}
      <div style={{
        padding: "28px 24px 0",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
        width: "100%",
      }}>
        <h2 style={{
          fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 700,
          color: "var(--color-text)",
          lineHeight: 1.28, letterSpacing: "-0.02em",
        }}>
          {question.question}
        </h2>
      </div>

      {/* ── Spacer — capped so desktop doesn't get too much gap ── */}
      <div style={{ flex: 1, minHeight: 16, maxHeight: 80 }} />

      {/* ── Statement card + scale ─────────────────────────────── */}
      <div style={{
        padding: "0 20px 44px",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>

        {/* Quote card */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          style={{
            padding: "20px 20px",
            borderRadius: 16,
            background: "var(--color-primary-tint)",
            border: "1px solid var(--color-primary-ring)",
            position: "relative",
          }}
        >
          {/* Quotation mark */}
          <span style={{
            position: "absolute", top: 14, left: 18,
            fontSize: 22, fontWeight: 800,
            color: "var(--color-primary)",
            lineHeight: 1, opacity: 0.7,
          }}>&ldquo;</span>
          <p style={{
            fontSize: 15, color: "var(--color-text-body)",
            lineHeight: 1.65,
            paddingLeft: 22,
          }}>
            {question.statement}
          </p>
        </m.div>

        {/* Scale labels */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 4, paddingRight: 4 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>Strongly disagree</span>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>Strongly agree</span>
        </div>

        {/* Pattern scale */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8,
        }}>
          {SCALE.map((item, i) => {
            const isSelected = chosen === item.id;
            const isAny = chosen !== null;
            return (
              <m.button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.18 }}
                whileTap={{ scale: 0.92 }}
                whileHover={!chosen ? { y: -1 } : {}}
                style={{
                  padding: "10px 4px 11px",
                  borderRadius: 14,
                  border: `1.5px solid ${isSelected ? "var(--color-primary)" : "rgba(28,26,46,0.09)"}`,
                  background: isSelected
                    ? "var(--color-primary-tint)"
                    : "var(--color-bg-card)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  cursor: chosen ? "default" : "pointer",
                  opacity: isAny && !isSelected ? 0.38 : 1,
                  transition: "background 0.15s, border-color 0.15s, opacity 0.2s",
                  boxShadow: isSelected ? "var(--shadow-sel)" : "0 1px 3px rgba(28,26,46,0.04)",
                }}
              >
                <span style={{
                  width: 30,
                  height: 30,
                  borderRadius: "var(--radius-pill)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 850,
                  color: isSelected ? "var(--color-bg-card)" : "var(--color-text)",
                  background: isSelected ? "var(--color-primary)" : "var(--color-bg-card-2)",
                  border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "var(--color-primary)" : "var(--color-text-muted)",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}>
                  {item.desc}
                </span>
              </m.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

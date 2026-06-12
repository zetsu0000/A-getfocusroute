"use client";

import { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

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
        maxWidth: 560,
        margin: "0 auto",
        width: "100%",
      }}>
        <h2
          className="v2-display"
          style={{
            fontSize: "clamp(21px, 5.4vw, 27px)",
            fontWeight: 550,
            lineHeight: 1.22,
            letterSpacing: "-0.02em",
          }}
        >
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

        {/* Statement — read back like an observation in the lab log */}
        <m.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.24 }}
          className="v2-panel"
          style={{
            padding: "22px 22px",
            borderColor: "rgba(124,138,255,0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: "var(--v2-grad-signal)",
              boxShadow: "0 0 14px rgba(124,138,255,0.6)",
            }}
          />
          <p className="v2-hud" style={{ marginBottom: 10, fontSize: 9.5 }}>
            Observation
          </p>
          <p
            className="v2-display"
            style={{
              fontSize: 18,
              fontWeight: 500,
              fontStyle: "italic",
              color: "var(--v2-ink)",
              lineHeight: 1.5,
            }}
          >
            &ldquo;{question.statement}&rdquo;
          </p>
        </m.div>

        {/* Scale labels */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 4, paddingRight: 4 }}>
          <span className="v2-hud" style={{ fontSize: 9.5 }}>Strongly disagree</span>
          <span className="v2-hud" style={{ fontSize: 9.5 }}>Strongly agree</span>
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
                initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={reduceMotion ? undefined : { delay: i * 0.035, duration: 0.18 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                whileHover={!reduceMotion && !chosen ? { y: -2 } : undefined}
                style={{
                  padding: "11px 4px 12px",
                  borderRadius: 15,
                  border: `1.5px solid ${isSelected ? "rgba(124,138,255,0.85)" : "var(--v2-line)"}`,
                  background: isSelected
                    ? "linear-gradient(150deg, rgba(124,138,255,0.2), rgba(155,232,255,0.08))"
                    : "linear-gradient(165deg, rgba(148,163,255,0.07), rgba(148,163,255,0.03))",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 7,
                  cursor: chosen ? "default" : "pointer",
                  opacity: isAny && !isSelected ? 0.32 : 1,
                  transition: "background 0.15s, border-color 0.15s, opacity 0.2s, box-shadow 0.15s",
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(124,138,255,0.3), 0 8px 28px rgba(124,138,255,0.25)"
                    : "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <span style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--v2-font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isSelected ? "#06070D" : "var(--v2-ink-dim)",
                  background: isSelected ? "var(--v2-grad-signal)" : "rgba(148,163,255,0.07)",
                  border: `1px solid ${isSelected ? "transparent" : "var(--v2-line)"}`,
                  boxShadow: isSelected ? "0 0 14px rgba(124,138,255,0.6)" : "none",
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "var(--v2-signal-2)" : "var(--v2-ink-faint)",
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

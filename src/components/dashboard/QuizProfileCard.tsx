"use client";

import { m } from "framer-motion";
import { scoreFromAnswers, getSymptomLevel } from "@/lib/symptom-level";
import type { QuizAnswer } from "@/types/quiz";

export function QuizProfileCard({ answers }: { answers: QuizAnswer[] }) {
  const score = scoreFromAnswers(answers);
  const level = getSymptomLevel(score);

  const rows = [
    { label: "Pattern lens", value: "Inattentive-C (illustrative)" },
    { label: "Friction snapshot", value: "High pattern intensity" },
    { label: "Energy read", value: "High motion / low idle" },
    { label: "Support strategy", value: "Body-doubling" },
  ];

  return (
    <div
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "var(--color-bg-card)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          padding: "16px 20px 14px",
          background:
            "linear-gradient(135deg,var(--color-primary-tint),var(--color-cognitive-tint))",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background:
              "linear-gradient(135deg,var(--color-primary),var(--color-cognitive))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🧠
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>
            Your Cognitive Profile
          </p>
          <p style={{ fontSize: 11, color: "var(--color-text-soft)", marginTop: 1 }}>
            Brain OS map · Saved to your account when signed in
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 99,
            background: level.bg,
            color: level.color,
          }}
        >
          {level.label}
        </span>
      </div>

      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
            Friction snapshot (illustrative)
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: level.color }}>
            {level.label}
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 99,
            background:
              "linear-gradient(to right,var(--color-primary-tint),var(--color-primary),var(--color-cognitive))",
            position: "relative",
          }}
        >
          <m.div
            initial={{ left: "0%" }}
            animate={{ left: `${level.pct}%` }}
            transition={{ delay: 0.4, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--color-bg-card)",
              border: `3px solid ${level.color}`,
              boxShadow: "0 2px 8px rgba(28,26,46,0.22)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["Low", "Mild", "Moderate", "High", "Very High"].map((l) => (
            <span key={l} style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: 12,
              background: "var(--color-bg-card-2)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--color-text-body)" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

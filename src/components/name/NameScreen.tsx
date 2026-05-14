"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";

export function NameScreen() {
  const { setName, setStep } = useQuizStore();
  const [local, setLocal]    = useState("");
  const valid = local.trim().length > 0;

  const handleContinue = () => {
    if (!valid) return;
    setName(local.trim());
    setStep("chart");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.28 }}
      style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Title */}
        <h1 style={{
          fontSize: 24, fontWeight: 800,
          color: "var(--color-primary)",
          textAlign: "center", lineHeight: 1.3,
          marginBottom: 4,
        }}>
          What&apos;s your name?
        </h1>

        {/* Name input */}
        <input
          type="text"
          placeholder="Enter your name"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          autoFocus
          style={{
            width: "100%", padding: "17px 20px",
            borderRadius: 14,
            background: "var(--color-bg-card)",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-primary)",
            fontSize: 16, outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#CBC0D3";
            e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(203,192,211,0.22)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow   = "none";
          }}
        />

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!valid}
          style={{
            width: "100%", padding: "18px",
            borderRadius: 16, fontSize: 16, fontWeight: 700,
            border: "none", cursor: valid ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            ...(valid
              ? { background: "var(--color-primary)", color: "#fff", boxShadow: "var(--shadow-btn)" }
              : { background: "var(--color-border)", color: "var(--color-text-muted)" }),
          }}
        >
          Continue
        </button>

      </div>
    </motion.div>
  );
}

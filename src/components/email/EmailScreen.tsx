"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";

export function EmailScreen() {
  const { setEmail, setStep } = useQuizStore();
  const [local, setLocal]     = useState("");
  const valid = local.includes("@") && local.includes(".");

  const handleContinue = () => {
    if (!valid) return;
    setEmail(local);
    setStep("name");
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
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800,
            color: "var(--color-primary)",
            lineHeight: 1.3,
          }}>
            Where should we send your{" "}
            <span style={{ color: "#CBC0D3" }}>
              ADHD test results?
            </span>
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--color-text-muted)" }}>
            Your report and personalized guide will be sent to the email below.
          </p>
        </div>

        {/* Email input */}
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: "var(--color-text-muted)", pointerEvents: "none",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <input
            type="email"
            placeholder="Email"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            style={{
              width: "100%", padding: "16px 16px 16px 44px",
              borderRadius: 14,
              background: "var(--color-bg-card)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-primary)",
              fontSize: 15, outline: "none",
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
        </div>

        {/* Legal */}
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <span style={{ color: "var(--color-primary)", textDecoration: "underline", cursor: "pointer" }}>Terms & Conditions</span>,{" "}
          <span style={{ color: "var(--color-primary)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>, and{" "}
          <span style={{ color: "var(--color-primary)", textDecoration: "underline", cursor: "pointer" }}>Subscription Policy</span>.
        </p>

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

        {/* Privacy card */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "16px 18px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-card)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6 }}>
            We respect your privacy and are committed to protecting your personal data.
            We&apos;ll send your results and guide to the email you provide.
          </p>
        </div>

      </div>
    </motion.div>
  );
}

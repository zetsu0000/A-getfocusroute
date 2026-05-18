"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,30}$/;
const VOWEL_REGEX = /[aeiouàáâãäéèêíìîóòôõöúùûü]/i;

function toTitleCase(name: string): string {
  return name.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function isValidName(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 30 &&
    NAME_REGEX.test(trimmed) &&
    VOWEL_REGEX.test(trimmed)
  );
}

export function NameScreen() {
  const { setName, setStep } = useQuizStore();
  const [local,   setLocal]   = useState("");
  const [touched, setTouched] = useState(false);

  const valid    = isValidName(local);
  const hasError = touched && local.length > 0 && !valid;

  const handleContinue = () => {
    if (!valid) return;
    setName(toTitleCase(local));
    setStep("chart");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.28 }}
      style={{
        minHeight: "100dvh",
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
          Personalize your signature reveal
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", textAlign: "center" }}>
          We&apos;ll use your name in your Cognitive Signature™ preview and Profile-to-Protocol™ overview.
        </p>

        {/* Name input */}
        <div>
          <input
            type="text"
            placeholder="Enter your first name"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            onBlur={() => setTouched(true)}
            autoFocus
            style={{
              width: "100%", padding: "17px 20px",
              borderRadius: 14,
              background: hasError ? "var(--color-error-tint)" : "var(--color-bg-card)",
              border: `1.5px solid ${hasError ? "var(--color-error)" : "var(--color-border)"}`,
              color: "var(--color-primary)",
              fontSize: 16, outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
            }}
            onFocus={(e) => {
              if (!hasError) {
                e.currentTarget.style.borderColor = "var(--color-cognitive)";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(107,92,165,0.2)";
              }
            }}
          />
          {hasError && (
            <m.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 6, fontSize: 12, color: "var(--color-error)", paddingLeft: 4 }}
            >
              Please enter a valid name (letters only, min 2 characters)
            </m.p>
          )}
        </div>

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
          Continue to My Partial Profile Reveal
        </button>

        {/* Privacy note */}
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          🔒 Your name stays private and is used only for personalization
        </p>

      </div>
    </m.div>
  );
}

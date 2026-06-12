"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Lock } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,30}$/;
const VOWEL_REGEX = /[aeiou\u00e0\u00e1\u00e2\u00e3\u00e4\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00f5\u00f6\u00fa\u00f9\u00fb\u00fc]/i;

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
        <h1 className="v2-display" style={{
          fontSize: 26, fontWeight: 550,
          color: "var(--v2-ink)",
          textAlign: "center", lineHeight: 1.25,
          marginBottom: 4,
        }}>
          Personalize your signature reveal
        </h1>
        <p style={{ fontSize: 14, color: "var(--v2-ink-faint)", textAlign: "center" }}>
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
            className={`v2-input ${hasError ? "v2-input-error" : ""}`}
            style={{ fontSize: 16 }}
          />
          {hasError && (
            <m.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 6, fontSize: 12, color: "var(--v2-error)", paddingLeft: 4 }}
            >
              Please enter a valid name (letters only, min 2 characters)
            </m.p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!valid}
          className={valid ? "v2-cta" : undefined}
          style={{
            width: "100%", padding: "18px", minHeight: 58,
            borderRadius: 999, fontSize: 16, fontWeight: 800,
            cursor: valid ? "pointer" : "not-allowed",
            ...(valid
              ? {}
              : {
                  background: "rgba(148,163,255,0.05)",
                  border: "1px solid var(--v2-line)",
                  color: "var(--v2-ink-ghost)",
                }),
          }}
        >
          Reveal My Profile Preview
        </button>

        {/* Privacy note */}
        <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", textAlign: "center", lineHeight: 1.6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Lock size={12} aria-hidden /> Your name stays private and is used only for personalization
        </p>

      </div>
    </m.div>
  );
}

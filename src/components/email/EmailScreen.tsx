"use client";

import { useRef, useState } from "react";
import { m } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";
import { getSignatureFromAnswers } from "@/lib/signature";
import { getSignatureIdentity } from "@/lib/signature-identity";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { getOrCreateActionEventId, trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { HudLabel } from "@/components/v2/primitives";

function toTitleCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function EmailScreen() {
  const { answers, setEmail, setName, setStep } = useQuizStore();
  const signature = getSignatureFromAnswers(answers);
  const identity = getSignatureIdentity(signature.signature);
  const [localName, setLocalName] = useState("");
  const [local, setLocal]     = useState("");
  const [touched, setTouched] = useState(false);
  const submittedRef = useRef(false);
  const valid   = local.includes("@") && local.includes(".");
  const hasError = touched && local.length > 0 && !valid;

  const handleContinue = () => {
    if (!valid) return;
    setEmail(local.trim().toLowerCase());

    // Name is optional — only store it if the user actually typed one.
    const cleanedName = localName.trim();
    if (cleanedName.length >= 2) {
      setName(toTitleCase(cleanedName));
    }

    if (!submittedRef.current) {
      submittedRef.current = true;
      trackEvent(FIRST_PARTY_EVENTS.emailSubmitted, {
        eventId: getOrCreateActionEventId("lead_email_submitted", "lead"),
        metadata: {
          content_name: "FocusRoute assessment email capture",
          content_type: "lead",
          value: 0,
          currency: "USD",
        },
      });
    }
    // Name capture is merged here, so we skip straight to the result reveal.
    setStep("chart");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      {/* ambient accent in the user's signature color */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(70% 45% at 50% 0%, rgba(${identity.accentRgb},0.14) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <HudLabel tone="signal" style={{ marginBottom: 14 }}>
            Route file compiled
          </HudLabel>
          <h1
            className="v2-display"
            style={{ fontSize: "clamp(25px, 6.6vw, 32px)", fontWeight: 550, lineHeight: 1.22 }}
          >
            Your{" "}
            <em style={{ fontStyle: "italic", color: identity.accent, textShadow: `0 0 24px rgba(${identity.accentRgb},0.5)` }}>
              {signature.signature}
            </em>{" "}
            profile is ready.
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--v2-ink-faint)", lineHeight: 1.6 }}>
            Add your email so we can save your results — and so you can come back to them anytime.
          </p>
        </div>

        {/* Name (optional) */}
        <div>
          <input
            type="text"
            placeholder="First name (optional)"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            className="v2-input"
          />
        </div>

        {/* Email input */}
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: "var(--v2-ink-faint)", pointerEvents: "none",
          }}>
            <EmailIcon />
          </span>
          <input
            type="email"
            placeholder="Enter your best email"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            onBlur={() => setTouched(true)}
            className={`v2-input ${hasError ? "v2-input-error" : ""}`}
            style={{ paddingLeft: 46 }}
          />
          {hasError && (
            <m.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 6, fontSize: 12, color: "var(--v2-error)", paddingLeft: 4 }}
            >
              Please enter a valid email address
            </m.p>
          )}
        </div>

        {/* Legal */}
        <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", textAlign: "center", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" style={{ color: "var(--v2-ink-dim)", textDecoration: "underline" }}>Terms & Conditions</a>,{" "}
          <a href="/privacy" style={{ color: "var(--v2-ink-dim)", textDecoration: "underline" }}>Privacy Policy</a>, and{" "}
          <a href="/refund-policy" style={{ color: "var(--v2-ink-dim)", textDecoration: "underline" }}>Refund Policy</a>.
        </p>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!valid}
          className={valid ? "v2-cta" : undefined}
          style={{
            width: "100%",
            minHeight: 58,
            padding: "18px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 800,
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
          See My Results
        </button>

        {/* Privacy card */}
        <div className="v2-panel" style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "16px 18px",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: "linear-gradient(140deg, rgba(124,138,255,0.3), rgba(155,232,255,0.12))",
            border: "1px solid rgba(163,178,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--v2-signal-2)" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>
            Private by default. We only use this to give you access to your results and relevant updates.
          </p>
        </div>

        <p style={{ fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center", lineHeight: 1.6 }}>
          FocusRoute provides educational profiling and does not provide medical diagnosis.
        </p>

      </div>
    </m.div>
  );
}

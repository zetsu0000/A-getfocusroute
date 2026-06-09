"use client";

import { useRef, useState } from "react";
import { m } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { getOrCreateActionEventId, trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

function toTitleCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function EmailScreen() {
  const { setEmail, setName, setStep } = useQuizStore();
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
        minHeight: "100dvh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800,
            color: "var(--color-primary)",
            lineHeight: 1.3,
          }}>
            Where should we send your results?
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            Your focus snapshot is ready. Add your email so you can come back to it anytime.
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
            style={{
              width: "100%", padding: "16px 16px",
              borderRadius: 14,
              background: "var(--color-bg-card)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-primary)",
              fontSize: 15, outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.boxShadow   = "0 0 0 3px var(--color-primary-ring)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow   = "none";
            }}
          />
        </div>

        {/* Email input */}
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: "var(--color-text-muted)", pointerEvents: "none",
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
            style={{
              width: "100%", padding: "16px 16px 16px 44px",
              borderRadius: 14,
              background: hasError ? "var(--color-error-tint)" : "var(--color-bg-card)",
              border: `1.5px solid ${hasError ? "var(--color-error)" : "var(--color-border)"}`,
              color: "var(--color-primary)",
              fontSize: 15, outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
            }}
            onFocus={(e) => {
              if (!hasError) {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.boxShadow   = "0 0 0 3px var(--color-primary-ring)";
              }
            }}
          />
          {hasError && (
            <m.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 6, fontSize: 12, color: "var(--color-error)", paddingLeft: 4 }}
            >
              Please enter a valid email address
            </m.p>
          )}
        </div>

        {/* Legal */}
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Terms & Conditions</a>,{" "}
          <a href="/privacy" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Privacy Policy</a>, and{" "}
          <a href="/refund-policy" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Subscription Policy</a>.
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
              ? { background: "var(--color-accent)", color: "#fff", boxShadow: "var(--shadow-btn-accent)" }
              : { background: "var(--color-border)", color: "var(--color-text-muted)" }),
          }}
        >
          See My Results
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
            background: "var(--color-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6 }}>
            Private by default. We only use this to give you access to your results and relevant updates.
          </p>
        </div>

        <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          FocusRoute provides educational profiling and does not provide medical diagnosis.
        </p>

      </div>
    </m.div>
  );
}

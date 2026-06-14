"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useQuizStore } from "@/store/quizStore";
import { getSignatureFromAnswers } from "@/lib/signature";
import { getSignatureIdentity } from "@/lib/signature-identity";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { getOrCreateActionEventId, trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { HudLabel } from "@/components/v2/primitives";

/**
 * Email capture as a preview-first save gate (funnel audit): the user sees
 * real result value — their pattern name and one concrete insight — BEFORE
 * being asked for an email. This is a content-density pass: the same visual
 * system, trimmed to the signature, one insight panel, the email field, and
 * the CTA. The funnel step order (loading → email → chart), the email-only
 * required field, and the Lead event are unchanged.
 */
export function EmailScreen() {
  const { answers, setEmail, setStep } = useQuizStore();
  const signature = getSignatureFromAnswers(answers);
  const identity = getSignatureIdentity(signature.signature);
  const [local, setLocal]     = useState("");
  const [touched, setTouched] = useState(false);
  const submittedRef = useRef(false);
  const previewTracked = useRef(false);
  const focusTracked = useRef(false);
  const valid   = local.includes("@") && local.includes(".");
  const hasError = touched && local.length > 0 && !valid;

  /* Since the quiz-15 pass, THIS screen is the free result preview — the
     event moves here with it (same name, same Meta bridge, fired once). */
  useEffect(() => {
    if (previewTracked.current) return;
    previewTracked.current = true;
    trackEvent(FIRST_PARTY_EVENTS.resultPreviewViewed, {
      metadata: { signature_key: signature.signature, source: "email_gate" },
    });
  }, [signature.signature]);

  /* First focus on the email field — the abandon signal the audit asked
     for: gate seen vs gate engaged vs gate completed. */
  const handleEmailFocus = () => {
    if (focusTracked.current) return;
    focusTracked.current = true;
    trackEvent(FIRST_PARTY_EVENTS.emailFieldFocused, { meta: false });
  };

  const handleContinue = () => {
    if (!valid) return;
    setEmail(local.trim().toLowerCase());

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
    // Email is the only required field; downstream screens fall back to a
    // safe name, so we skip straight to the result reveal.
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
        padding: "36px 20px 44px",
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

      <div style={{ position: "relative", width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── The free preview — value before the ask ─────────── */}
        <div style={{ textAlign: "center" }}>
          <HudLabel tone="signal" style={{ marginBottom: 12 }}>
            Pattern identified — your free preview
          </HudLabel>
          <h1
            className="v2-display"
            style={{ fontSize: "clamp(26px, 7vw, 34px)", fontWeight: 550, lineHeight: 1.15 }}
          >
            You&apos;re a{signature.signature === "Archivist" ? "n" : ""}{" "}
            <em style={{ fontStyle: "italic", color: identity.accent, textShadow: `0 0 24px rgba(${identity.accentRgb},0.5)` }}>
              {signature.signature}
            </em>
          </h1>
          <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--v2-ink-dim)", fontWeight: 600 }}>
            {signature.title}
          </p>
        </div>

        <div
          className="v2-panel"
          style={{ padding: "18px 18px", borderColor: `rgba(${identity.accentRgb},0.30)` }}
        >
          {/* one concrete insight */}
          <HudLabel style={{ marginBottom: 8, fontSize: 9.5 }}>What we found</HudLabel>
          <p style={{ fontSize: 14, color: "var(--v2-ink)", fontWeight: 600, lineHeight: 1.6 }}>
            {signature.preview}
          </p>
        </div>

        {/* Email input — the one required field, so it leads */}
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
            onFocus={handleEmailFocus}
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
          See My Full Results
        </button>

        {/* One short privacy line */}
        <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", textAlign: "center", lineHeight: 1.6 }}>
          Private by default — we only use your email to give you access to your results.
        </p>

        {/* Minimal Terms / Privacy links */}
        <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", textAlign: "center", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" style={{ color: "var(--v2-ink-dim)", textDecoration: "underline" }}>Terms</a>{" "}
          and{" "}
          <a href="/privacy" style={{ color: "var(--v2-ink-dim)", textDecoration: "underline" }}>Privacy Policy</a>.
        </p>

        <p style={{ fontSize: 11, color: "var(--v2-ink-ghost)", textAlign: "center", lineHeight: 1.6 }}>
          FocusRoute provides educational profiling and does not provide medical diagnosis.
        </p>

      </div>
    </m.div>
  );
}

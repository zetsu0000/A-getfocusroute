"use client";

import { useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { CheckCircle2, Mail, LayoutDashboard } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { safeName } from "@/lib/personalization";
import { FocusField } from "@/components/v2/FocusField";
import { HudLabel } from "@/components/v2/primitives";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import { trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

export function SuccessScreen() {
  const { name, email } = useQuizStore();
  const displayName = safeName(name, "there");
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";

  /* Client-side confirmation the buyer reached the end state. First-party only. */
  useEffect(() => {
    trackEvent(FIRST_PARTY_EVENTS.successViewed, { meta: false });
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", overflow: "hidden" }}
    >
      {/* the route, fully organized — celebration as signal, not confetti */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <FocusField coherence={1} intensity={0.9} showRoute theme={theme} accentRgb={dark ? "217,188,127" : "154,122,46"} accentRgb2={dark ? "155,232,255" : "20,135,181"} />
      </div>

      <m.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        style={{ position: "relative", width: 96, height: 96, display: "grid", placeItems: "center", marginBottom: 28 }}
      >
        <m.span
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: -8, borderRadius: "50%", border: dark ? "1px dashed rgba(217,188,127,0.45)" : "1px dashed rgba(154,122,46,0.5)" }}
        />
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 26,
            background: dark
              ? "linear-gradient(140deg, rgba(217,188,127,0.3), rgba(124,138,255,0.2))"
              : "linear-gradient(140deg, rgba(201,154,67,0.22), rgba(70,85,230,0.14)), #FFFFFF",
            border: dark ? "1px solid rgba(217,188,127,0.55)" : "1px solid rgba(154,122,46,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: dark
              ? "0 14px 50px rgba(217,188,127,0.3), inset 0 1px 0 rgba(255,248,226,0.3)"
              : "0 14px 40px rgba(154,122,46,0.22), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <CheckCircle2 size={42} color="var(--v2-gold-bright)" strokeWidth={2} />
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30 }}
        style={{ position: "relative" }}
      >
        <HudLabel tone="gold" style={{ marginBottom: 12 }}>
          Route unlocked
        </HudLabel>
        <h1
          className="v2-display"
          style={{ fontSize: "clamp(28px, 7.4vw, 36px)", fontWeight: 550, lineHeight: 1.2, marginBottom: 12 }}
        >
          You&apos;re all set,{" "}
          <em className="v2-text-gold" style={{ fontStyle: "italic" }}>{displayName}</em>!
        </h1>
      </m.div>

      <m.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.40 }}
        style={{ position: "relative", fontSize: 15, color: "var(--v2-ink-dim)", lineHeight: 1.7, maxWidth: 360, marginBottom: 28 }}
      >
        Your full plan is ready in your account — sign in with this email anytime to get back to it. Start with your first step — it&apos;s short.
      </m.p>
      <p style={{ position: "relative", fontSize: 11, color: "var(--v2-ink-ghost)", lineHeight: 1.6, maxWidth: 360, marginBottom: 20 }}>
        FocusRoute provides educational profiling and does not provide medical diagnosis.
      </p>

      {email && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.50 }}
          className="v2-panel"
          style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, borderRadius: 999, padding: "13px 22px", marginBottom: 30 }}
        >
          <Mail size={17} color="var(--v2-signal-2)" />
          <p style={{ fontSize: 13, color: "var(--v2-ink-dim)" }}>
            Saved to <span style={{ fontWeight: 700, color: "var(--v2-ink)" }}>{email}</span>
          </p>
        </m.div>
      )}

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        style={{ position: "relative", maxWidth: 380, width: "100%", marginBottom: 10 }}
      >
        <Link
          href="/dashboard"
          className="v2-cta v2-cta-gold"
          style={{ width: "100%", minHeight: 58, fontSize: 15 }}
        >
          <LayoutDashboard size={18} />
          Open My Plan
        </Link>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.60 }}
        className="v2-panel"
        style={{ position: "relative", padding: "24px 26px", maxWidth: 380, width: "100%" }}
      >
        <HudLabel style={{ marginBottom: 16 }}>What happens next</HudLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 13, textAlign: "left" }}>
          {[
            { step: "1", text: "Open your account to see your full focus pattern and plan." },
            { step: "2", text: "Start with your first step — what to try when starting feels heavy." },
            { step: "3", text: "Work through your plan at your pace. Even 10 minutes counts." },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid rgba(163,178,255,0.35)", background: "rgba(124,138,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--v2-font-mono)", fontSize: 12, color: "var(--v2-signal-2)" }}>{step}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.55, paddingTop: 4 }}>{text}</p>
            </div>
          ))}
        </div>
      </m.div>
    </m.div>
  );
}

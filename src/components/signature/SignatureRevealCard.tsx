"use client";

import { m, useReducedMotion } from "framer-motion";
import { SignatureSigil } from "./SignatureSigil";
import { getSignatureIdentity } from "@/lib/signature-identity";

/**
 * SignatureRevealCard — premium reveal moment for a Cognitive Signature.
 * Used in ChartScreen (post-quiz preview) and PaywallScreen (locked hero).
 *
 * Mobile-first. Respects reduced-motion preference. Uses pseudo-3D via
 * CSS transforms + framer motion — no WebGL.
 */

type Variant = "preview" | "paywall";

type Props = {
  signatureKey: string;
  signatureName: string;
  signatureEssence?: string;
  signatureSummary?: string;
  /** Variant — "preview" (light card, post-quiz) or "paywall" (dark hero). */
  variant?: Variant;
  /** Override the displayed reveal statement. */
  revealStatement?: string;
};

export function SignatureRevealCard({
  signatureKey,
  signatureName,
  signatureEssence,
  signatureSummary,
  variant = "preview",
  revealStatement,
}: Props) {
  const identity = getSignatureIdentity(signatureKey);
  const reduce = useReducedMotion();
  const isPaywall = variant === "paywall";

  const statement = revealStatement ?? identity.revealStatement;
  const essence   = signatureEssence ?? identity.essence;
  const summary   = signatureSummary ?? identity.summary;

  const bg = isPaywall
    ? `linear-gradient(150deg, #0E0B16 0%, ${identity.accentDark} 70%, #0E0B16 100%)`
    : `linear-gradient(150deg, #1A1530 0%, ${identity.accentDark} 75%)`;

  const titleColor = "#FFFFFF";
  const supportColor = "rgba(255,255,255,0.62)";
  const labelColor = `rgba(${identity.accentRgb}, 1)`;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 22,
        overflow: "hidden",
        background: bg,
        boxShadow: `0 18px 48px rgba(${identity.accentRgb},0.28), 0 2px 8px rgba(0,0,0,0.2)`,
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      {/* dot-grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      {/* corner accent glow */}
      <m.div
        aria-hidden="true"
        initial={reduce ? undefined : { opacity: 0.5, scale: 0.95 }}
        animate={reduce ? undefined : { opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: -90,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${identity.accentRgb},0.45) 0%, rgba(${identity.accentRgb},0) 68%)`,
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "24px 22px 26px" }}>

        {/* eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Cognitive Signature
          </span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: labelColor,
            }}
          >
            {identity.classLabel.replace("Class · ", "")}
          </span>
        </div>

        {/* hero row: sigil + name */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center", marginBottom: 16 }}>
          <m.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.7, rotate: -8 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
            transition={reduce ? undefined : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ flexShrink: 0 }}
          >
            <m.div
              animate={reduce ? undefined : { y: [0, -3.5, 0] }}
              transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <SignatureSigil signatureKey={identity.key} size={84} withGlow />
            </m.div>
          </m.div>

          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: supportColor, fontWeight: 700, marginBottom: 4 }}>
              Your signature
            </p>
            <m.h2
              initial={reduce ? undefined : { opacity: 0, y: 12, rotateX: -10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
              transition={reduce ? undefined : { duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: "clamp(30px, 9vw, 44px)",
                fontWeight: 900,
                color: titleColor,
                lineHeight: 0.95,
                letterSpacing: "-0.035em",
                textShadow: "0 14px 38px rgba(0,0,0,0.28)",
                overflowWrap: "break-word",
              }}
            >
              {signatureName}
            </m.h2>
          </div>
        </div>

        {/* essence chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: 999,
            background: `rgba(${identity.accentRgb},0.18)`,
            border: `1px solid rgba(${identity.accentRgb},0.32)`,
            marginBottom: 14,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: identity.accent }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: titleColor, letterSpacing: "-0.005em" }}>{essence}</span>
        </div>

        {/* reveal statement */}
        <m.p
          initial={reduce ? undefined : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={reduce ? undefined : { duration: 0.55, delay: 0.25 }}
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: titleColor,
            lineHeight: 1.45,
            marginBottom: 10,
            letterSpacing: "-0.01em",
          }}
        >
          {statement}
        </m.p>

        {/* summary */}
        <p style={{ fontSize: 13, color: supportColor, lineHeight: 1.6 }}>
          {summary}
        </p>
      </div>
    </div>
  );
}

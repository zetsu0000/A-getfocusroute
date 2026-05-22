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

function SignatureMotif({
  sigilKey,
  accentRgb,
}: {
  sigilKey: string;
  accentRgb: string;
}) {
  const line = `rgba(${accentRgb},0.56)`;
  const soft = `rgba(${accentRgb},0.2)`;

  if (sigilKey === "thrust") {
    return (
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ position: "absolute", right: 18 + i * 14, top: 74 + i * 10, width: 48 - i * 8, height: 2, borderRadius: 999, background: line, transform: "rotate(-18deg)", opacity: 0.75 - i * 0.16 }} />
        ))}
      </div>
    );
  }

  if (sigilKey === "blueprint") {
    return (
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${soft} 1px, transparent 1px), linear-gradient(90deg, ${soft} 1px, transparent 1px)`, backgroundSize: "34px 34px", maskImage: "linear-gradient(120deg, transparent 0%, #000 36%, transparent 82%)", opacity: 0.75 }} />
    );
  }

  if (sigilKey === "burst") {
    return (
      <div aria-hidden="true" style={{ position: "absolute", right: 20, top: 28, width: 78, height: 78, pointerEvents: "none" }}>
        {[0, 45, 90, 135].map((deg) => (
          <span key={deg} style={{ position: "absolute", left: "50%", top: "50%", width: 34, height: 1.5, borderRadius: 999, background: line, transformOrigin: "0 50%", transform: `rotate(${deg}deg)`, opacity: 0.62 }} />
        ))}
      </div>
    );
  }

  if (sigilKey === "ember") {
    return (
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ position: "absolute", right: 42 + i * 18, bottom: 34 + (i % 2) * 18, width: 5 + i, height: 5 + i, borderRadius: "50%", background: line, opacity: 0.62 - i * 0.09 }} />
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" style={{ position: "absolute", right: 18, top: 38, width: 112, height: 112, borderRadius: "50%", border: `1px solid ${line}`, transform: "rotate(-22deg)", pointerEvents: "none", opacity: 0.5 }}>
      <span style={{ position: "absolute", right: 16, top: 18, width: 7, height: 7, borderRadius: "50%", background: line }} />
      <span style={{ position: "absolute", left: 28, bottom: 20, width: 4, height: 4, borderRadius: "50%", background: line, opacity: 0.62 }} />
    </div>
  );
}

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
        perspective: 900,
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

      <SignatureMotif sigilKey={identity.sigilKey} accentRgb={identity.accentRgb} />

      {/* corner accent light */}
      <div
        aria-hidden="true"
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

      <div style={{ position: "relative", padding: "24px 22px 26px", transformStyle: "preserve-3d" }}>

        {/* class-index rail — collectible rank marker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 22,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.42)",
            }}
          >
            Cognitive Signature
          </span>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(255,255,255,0.18), rgba(255,255,255,0))" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: labelColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Class · {identity.classIndex}
          </span>
        </div>

        {/* hero row: sigil + name + class label */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 18,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <m.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.86, rotate: -5, rotateX: 12 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0, rotateX: 0 }}
            transition={reduce ? undefined : { duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
            style={{ flexShrink: 0, transformStyle: "preserve-3d" }}
          >
            <div style={{ transform: "translateZ(18px)" }}>
              <SignatureSigil signatureKey={identity.key} size={92} withGlow />
            </div>
          </m.div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: labelColor,
                marginBottom: 6,
              }}
            >
              {identity.classLabel}
            </p>
            <div style={{ position: "relative" }}>
              {/* faint outline ghost behind the title for depth */}
              {!reduce && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontSize: "clamp(30px, 9vw, 46px)",
                    fontWeight: 900,
                    color: "transparent",
                    WebkitTextStroke: `1px rgba(${identity.accentRgb},0.35)`,
                    lineHeight: 0.95,
                    letterSpacing: "-0.035em",
                    transform: "translate(1.5px, 2px)",
                    pointerEvents: "none",
                    overflowWrap: "break-word",
                  }}
                >
                  {signatureName}
                </span>
              )}
              <m.h2
                initial={reduce ? undefined : { opacity: 0, y: 10, rotateX: -8 }}
                animate={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
                transition={reduce ? undefined : { duration: 0.42, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "relative",
                  fontSize: "clamp(30px, 9vw, 46px)",
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
            {/* accent rule + glyph word */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ width: 18, height: 2, background: identity.accent, borderRadius: 999 }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Sigil · {identity.glyph}
              </span>
            </div>
          </div>
        </div>

        {/* essence chip */}
        <m.div
          initial={reduce ? undefined : { opacity: 0, y: 8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={reduce ? undefined : { duration: 0.32, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
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
        </m.div>
        {/* reveal statement */}
        <m.p
          initial={reduce ? undefined : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={reduce ? undefined : { duration: 0.38, delay: 0.34 }}
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

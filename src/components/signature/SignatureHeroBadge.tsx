import type { CSSProperties } from "react";
import { SignatureSigil } from "./SignatureSigil";
import { getSignatureIdentity } from "@/lib/signature-identity";

/**
 * SignatureHeroBadge — server-rendered premium hero card for the
 * dashboard /profile page. No client APIs.
 *
 * Renders the sigil, archetype name, essence chip, and a short summary
 * on a dark accent-tinted card to make the signature feel like an asset.
 */

type Props = {
  signatureKey: string | null | undefined;
  signatureName: string;
  signatureTitle?: string;
  signatureDesc?: string;
  overallScore?: number;
  scoreLabel?: string;
  unlockedBadge?: string;
  style?: CSSProperties;
};

export function SignatureHeroBadge({
  signatureKey,
  signatureName,
  signatureTitle,
  signatureDesc,
  overallScore,
  scoreLabel,
  unlockedBadge = "Profile report unlocked",
  style,
}: Props) {
  const identity = getSignatureIdentity(signatureKey);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 22,
        overflow: "hidden",
        background: `linear-gradient(150deg, #14101D 0%, ${identity.accentDark} 78%)`,
        boxShadow: `0 18px 48px rgba(${identity.accentRgb},0.26), 0 2px 8px rgba(0,0,0,0.18)`,
        border: `1px solid rgba(255,255,255,0.06)`,
        ...style,
      }}
    >
      {/* dot grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      {/* corner glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${identity.accentRgb},0.4) 0%, rgba(${identity.accentRgb},0) 70%)`,
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "22px 22px 24px" }}>
        {/* class-index rail */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
            Cognitive Signature
          </span>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(255,255,255,0.18), rgba(255,255,255,0))" }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: `rgba(${identity.accentRgb},1)`, fontVariantNumeric: "tabular-nums" }}>
            Class · {identity.classIndex}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center", marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <SignatureSigil signatureKey={identity.key} size={80} withGlow />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: `rgba(${identity.accentRgb},1)`,
                marginBottom: 4,
              }}
            >
              {identity.classLabel}
            </p>
            <h2
              style={{
                fontSize: "clamp(26px, 7vw, 34px)",
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                marginBottom: 6,
                textShadow: "0 12px 36px rgba(0,0,0,0.26)",
              }}
            >
              {signatureName}
            </h2>
            {signatureTitle && (
              <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.78)", lineHeight: 1.35 }}>
                {signatureTitle}
              </p>
            )}
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
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{identity.essence}</span>
        </div>

        {signatureDesc && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, marginBottom: 16 }}>
            {signatureDesc}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {typeof overallScore === "number" && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.08)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              Overall strength: {overallScore}/100
            </span>
          )}
          {scoreLabel && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              {scoreLabel}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 12px",
              borderRadius: 99,
              background: `rgba(${identity.accentRgb},0.2)`,
              color: "#FFFFFF",
              border: `1px solid rgba(${identity.accentRgb},0.4)`,
            }}
          >
            {unlockedBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

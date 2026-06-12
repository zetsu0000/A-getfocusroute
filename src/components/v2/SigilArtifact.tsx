"use client";

import { m, useReducedMotion } from "framer-motion";
import { SignatureSigil } from "@/components/signature/SignatureSigil";
import { getSignatureIdentity } from "@/lib/signature-identity";
import { TiltCard } from "./TiltCard";
import { SparkBurst } from "./SparkBurst";

/**
 * SigilArtifact — the V2 premium identity artifact.
 *
 * The user's Cognitive Signature rendered as a precious dark object:
 * pointer-tracked 3D tilt, holographic sheen, orbital ring around the sigil,
 * mono class telemetry, editorial serif name. Used by the result reveal and
 * (in locked form) by the paywall. Replaces SignatureRevealCard inside the
 * funnel only — the dashboard keeps the original card.
 */

type Props = {
  signatureKey: string;
  signatureName: string;
  essence?: string;
  summary?: string;
  revealStatement?: string;
  variant?: "reveal" | "paywall";
};

const ease = [0.16, 1, 0.3, 1] as const;

export function SigilArtifact({
  signatureKey,
  signatureName,
  essence,
  summary,
  revealStatement,
  variant = "reveal",
}: Props) {
  const identity = getSignatureIdentity(signatureKey);
  const reduce = useReducedMotion();
  const isPaywall = variant === "paywall";

  const fade = (delay: number) => ({
    initial: reduce ? undefined : { opacity: 0, y: 12 },
    animate: reduce ? undefined : { opacity: 1, y: 0 },
    transition: reduce ? undefined : { duration: 0.5, delay, ease },
  });

  const shownEssence = essence ?? identity.essence;
  const shownSummary = summary ?? identity.summary;
  const shownStatement = revealStatement ?? identity.revealStatement;

  return (
    <div
      style={{
        position: "relative",
        // the artifact hovers — a held object, not a flat card
        animation: !reduce && !isPaywall ? "v2-float 7s ease-in-out infinite" : undefined,
      }}
    >
      {/* signature locking in — one radial burst behind the reveal */}
      {!isPaywall && <SparkBurst accentRgb={identity.accentRgb} delay={650} />}
    <TiltCard maxTilt={isPaywall ? 4 : 8} style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          borderRadius: 26,
          overflow: "hidden",
          background: `
            radial-gradient(120% 90% at 80% -10%, rgba(${identity.accentRgb},0.30) 0%, transparent 55%),
            radial-gradient(100% 100% at 10% 110%, rgba(${identity.accentRgb},0.14) 0%, transparent 50%),
            linear-gradient(160deg, #0B0E1A 0%, #070811 60%, #05060C 100%)
          `,
          border: `1px solid rgba(${identity.accentRgb},0.30)`,
          boxShadow: `
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 30px 80px rgba(2,3,10,0.7),
            0 0 60px rgba(${identity.accentRgb},0.16)
          `,
        }}
      >
        {/* dot matrix */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />

        {/* holographic sheen — slow conic drift */}
        {!reduce && (
          <m.div
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "180%",
              aspectRatio: "1",
              marginLeft: "-90%",
              marginTop: "-90%",
              background: `conic-gradient(from 0deg,
                transparent 0deg,
                rgba(${identity.accentRgb},0.08) 40deg,
                transparent 90deg,
                rgba(255,255,255,0.04) 180deg,
                transparent 230deg,
                rgba(${identity.accentRgb},0.06) 300deg,
                transparent 360deg)`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* mount light-sweep */}
        {!reduce && (
          <m.div
            aria-hidden="true"
            initial={{ x: "-130%" }}
            animate={{ x: "130%" }}
            transition={{ duration: 1.4, delay: 0.5, ease: [0.6, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "55%",
              background:
                "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.07) 50%, transparent 80%)",
              transform: "skewX(-12deg)",
              pointerEvents: "none",
            }}
          />
        )}

        <div style={{ position: "relative", padding: isPaywall ? "22px 22px 24px" : "26px 24px 28px" }}>
          {/* telemetry rail */}
          <m.div
            {...fade(0)}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isPaywall ? 18 : 24 }}
          >
            <span className="v2-hud" style={{ color: "rgba(255,255,255,0.40)" }}>
              Cognitive Signature
            </span>
            <span
              aria-hidden="true"
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(90deg, rgba(${identity.accentRgb},0.5), transparent)`,
              }}
            />
            <span
              className="v2-hud"
              style={{ color: `rgba(${identity.accentRgb},1)`, fontVariantNumeric: "tabular-nums" }}
            >
              Class {identity.classIndex}
            </span>
          </m.div>

          {/* sigil + name */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 20,
              alignItems: "center",
              marginBottom: isPaywall ? 14 : 20,
            }}
          >
            <m.div
              initial={reduce ? undefined : { opacity: 0, scale: 0.7, rotate: -10 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
              transition={reduce ? undefined : { duration: 0.7, delay: 0.12, ease }}
              style={{
                position: "relative",
                width: isPaywall ? 96 : 112,
                height: isPaywall ? 96 : 112,
                display: "grid",
                placeItems: "center",
              }}
            >
              {/* orbital dashed ring */}
              <m.span
                aria-hidden="true"
                animate={reduce ? undefined : { rotate: 360 }}
                transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: -2,
                  borderRadius: "50%",
                  border: `1px dashed rgba(${identity.accentRgb},0.45)`,
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 8,
                  borderRadius: "50%",
                  border: `1px solid rgba(${identity.accentRgb},0.25)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 14px 38px rgba(${identity.accentRgb},0.22)`,
                }}
              />
              <SignatureSigil signatureKey={identity.key} size={isPaywall ? 78 : 92} withGlow />
            </m.div>

            <div style={{ minWidth: 0 }}>
              <m.p
                {...fade(0.2)}
                className="v2-hud"
                style={{ color: `rgba(${identity.accentRgb},1)`, marginBottom: 8 }}
              >
                {identity.classLabel}
              </m.p>
              <m.h2
                initial={reduce ? undefined : { opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={reduce ? undefined : { duration: 0.65, delay: 0.28, ease }}
                className="v2-display"
                style={{
                  fontSize: isPaywall ? "clamp(30px, 8vw, 42px)" : "clamp(34px, 9.5vw, 52px)",
                  fontWeight: 600,
                  lineHeight: 0.96,
                  letterSpacing: "-0.025em",
                  color: "#FFFFFF",
                  textShadow: `0 12px 44px rgba(${identity.accentRgb},0.4)`,
                  overflowWrap: "break-word",
                }}
              >
                {signatureName}
              </m.h2>
              <m.div
                {...fade(0.38)}
                style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9 }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 20, height: 2, borderRadius: 999, background: identity.accent }}
                />
                <span className="v2-hud" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Sigil / {identity.glyph}
                </span>
              </m.div>
            </div>
          </div>

          {/* essence chip */}
          <m.div
            {...fade(0.46)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 13px",
              borderRadius: 999,
              background: `rgba(${identity.accentRgb},0.14)`,
              border: `1px solid rgba(${identity.accentRgb},0.36)`,
              marginBottom: 14,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: identity.accent,
                boxShadow: `0 0 10px ${identity.accent}`,
              }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.005em" }}>
              {shownEssence}
            </span>
          </m.div>

          <m.p
            {...fade(0.54)}
            style={{
              fontFamily: "var(--v2-font-display)",
              fontSize: isPaywall ? 15.5 : 17,
              fontWeight: 500,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.5,
              marginBottom: 10,
              letterSpacing: "-0.005em",
            }}
          >
            {shownStatement}
          </m.p>

          <m.p {...fade(0.6)} style={{ fontSize: 13, color: "rgba(255,255,255,0.58)", lineHeight: 1.65 }}>
            {shownSummary}
          </m.p>
        </div>
      </div>
    </TiltCard>
    </div>
  );
}

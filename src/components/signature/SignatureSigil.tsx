import type { CSSProperties } from "react";
import { getSignatureIdentity, type SigilKey } from "@/lib/signature-identity";

/**
 * SignatureSigil — server-rendered SVG emblem for a Cognitive Signature.
 *
 * Renders a unified medallion frame (rounded hex) with a per-archetype glyph.
 * No client APIs — safe in server components.
 *
 * For animated reveal moments wrap with framer motion in a client component.
 */

type Props = {
  signatureKey: string | null | undefined;
  /** Outer size in px. Defaults to 96. */
  size?: number;
  /** Render a subtle radial glow behind the sigil. */
  withGlow?: boolean;
  style?: CSSProperties;
  className?: string;
};

/* Inner glyph paths — each in a 64x64 coordinate space, centered on (32,32). */
function GlyphThrust({ color }: { color: string }) {
  // Sprinter — three forward chevrons stacked, motion vector.
  return (
    <g stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M16 22 L30 32 L16 42" />
      <path d="M26 22 L40 32 L26 42" />
      <path d="M36 22 L50 32 L36 42" opacity="0.55" />
    </g>
  );
}

function GlyphBlueprint({ color }: { color: string }) {
  // Archivist — nested rotated squares, ordered depth.
  return (
    <g stroke={color} strokeWidth="2.2" strokeLinejoin="round" fill="none">
      <rect x="16" y="16" width="32" height="32" rx="2" />
      <rect x="22" y="22" width="20" height="20" rx="1.5" opacity="0.75" />
      <rect x="28" y="28" width="8" height="8" rx="1" opacity="0.55" fill={color} fillOpacity="0.18" />
      <line x1="32" y1="10" x2="32" y2="16" opacity="0.6" />
      <line x1="32" y1="48" x2="32" y2="54" opacity="0.6" />
      <line x1="10" y1="32" x2="16" y2="32" opacity="0.6" />
      <line x1="48" y1="32" x2="54" y2="32" opacity="0.6" />
    </g>
  );
}

function GlyphBurst({ color }: { color: string }) {
  // Spark — 8-point starburst with inner gem.
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const x1 = 32 + Math.cos(angle) * 12;
    const y1 = 32 + Math.sin(angle) * 12;
    const x2 = 32 + Math.cos(angle) * 22;
    const y2 = 32 + Math.sin(angle) * 22;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.1" strokeLinecap="round" opacity={i % 2 === 0 ? 1 : 0.45} />;
  });
  return (
    <g fill="none">
      {rays}
      <polygon points="32,20 38,32 32,44 26,32" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
    </g>
  );
}

function GlyphEmber({ color }: { color: string }) {
  // Reactor — radiating circles with a flame-shaped core.
  return (
    <g fill="none" stroke={color} strokeWidth="2.2">
      <circle cx="32" cy="32" r="18" opacity="0.18" />
      <circle cx="32" cy="32" r="13" opacity="0.4" />
      {/* flame core (teardrop) */}
      <path d="M32 18 C40 26 40 36 32 46 C24 36 24 26 32 18 Z" fill={color} fillOpacity="0.22" strokeLinejoin="round" />
      <circle cx="32" cy="36" r="2.2" fill={color} stroke="none" />
    </g>
  );
}

function GlyphOrbit({ color }: { color: string }) {
  // Drifter — orbit ring with anchor node.
  return (
    <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <ellipse cx="32" cy="32" rx="20" ry="10" transform="rotate(-22 32 32)" opacity="0.55" />
      <ellipse cx="32" cy="32" rx="20" ry="10" transform="rotate(22 32 32)" opacity="0.35" />
      <circle cx="32" cy="32" r="5" fill={color} fillOpacity="0.22" />
      <circle cx="14" cy="26" r="2.3" fill={color} stroke="none" />
      <circle cx="50" cy="38" r="1.8" fill={color} stroke="none" opacity="0.7" />
    </g>
  );
}

function Glyph({ sigilKey, color }: { sigilKey: SigilKey; color: string }) {
  switch (sigilKey) {
    case "thrust":    return <GlyphThrust    color={color} />;
    case "blueprint": return <GlyphBlueprint color={color} />;
    case "burst":     return <GlyphBurst     color={color} />;
    case "ember":     return <GlyphEmber     color={color} />;
    case "orbit":     return <GlyphOrbit     color={color} />;
  }
}

/* Hexagonal medallion frame for consistency across all 5 signatures. */
function MedallionFrame({ color, gradientId, frameId }: { color: string; gradientId: string; frameId: string }) {
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={frameId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* hex with rounded corners — points up/down */}
      <polygon
        points="32,3 57,17 57,47 32,61 7,47 7,17"
        fill={`url(#${gradientId})`}
        fillOpacity="0.08"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
      />
      <polygon
        points="32,6 54.5,18.5 54.5,45.5 32,58 9.5,45.5 9.5,18.5"
        fill="none"
        stroke={`url(#${frameId})`}
        strokeWidth="0.6"
        opacity="0.6"
      />
    </>
  );
}

export function SignatureSigil({
  signatureKey,
  size = 96,
  withGlow = false,
  style,
  className,
}: Props) {
  const identity = getSignatureIdentity(signatureKey);
  const uid = `sig-${identity.key.toLowerCase()}`;
  const gradientId = `${uid}-fill`;
  const frameId = `${uid}-frame`;
  const glowId = `${uid}-glow`;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      aria-hidden="true"
    >
      {withGlow && (
        <div
          style={{
            position: "absolute",
            inset: -size * 0.18,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${identity.accentRgb},0.32) 0%, rgba(${identity.accentRgb},0) 70%)`,
            filter: "blur(8px)",
            pointerEvents: "none",
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        style={{ position: "relative", zIndex: 1, filter: withGlow ? `drop-shadow(0 6px 18px rgba(${identity.accentRgb},0.35))` : undefined }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={identity.accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={identity.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill={`url(#${glowId})`} />
        <MedallionFrame color={identity.accent} gradientId={gradientId} frameId={frameId} />
        <Glyph sigilKey={identity.sigilKey} color={identity.accent} />
      </svg>
    </div>
  );
}

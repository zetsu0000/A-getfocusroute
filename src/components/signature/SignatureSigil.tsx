import { useId, type CSSProperties } from "react";
import { getSignatureIdentity, type SigilKey } from "@/lib/signature-identity";

/**
 * SignatureSigil — server-rendered SVG emblem for a Cognitive Signature.
 *
 * Renders a unified hex medallion frame with vertex dots + top notch
 * (class-emblem ornamentation) and a per-archetype inner glyph.
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

/* ──────────────────────────────────────────────────────────────────────────
 * Inner glyphs — each in a 64x64 coordinate space, centered on (32,32).
 * Each glyph keeps a consistent 2.4px primary stroke and 18px max radius
 * so the 5 sigils feel like a true visual family.
 * ────────────────────────────────────────────────────────────────────────── */

function GlyphThrust({ color }: { color: string }) {
  // Sprinter / Activation — Delta triangle of change, velocity bar, motion dots.
  return (
    <g fill="none">
      {/* upward triangle (delta = change) */}
      <path
        d="M32 17 L46 41 L18 41 Z"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.16"
      />
      {/* horizontal velocity bar through base */}
      <line
        x1="14" y1="46" x2="50" y2="46"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* motion trail dots */}
      <circle cx="9"  cy="46" r="1.3" fill={color} opacity="0.7" />
      <circle cx="55" cy="46" r="1.3" fill={color} opacity="0.5" />
      {/* inner forward-arrow notch */}
      <path
        d="M28 32 L36 32 L32 28 M32 36 L32 28"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function GlyphBlueprint({ color }: { color: string }) {
  // Archivist / Depth — A threshold/portal: two columns + lintel + foundation,
  // with a single offset inner frame suggesting layered depth.
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {/* outer frame */}
      <path
        d="M14 16 L14 48 M50 16 L50 48 M14 16 L50 16 M14 48 L50 48"
        strokeWidth="2.4"
      />
      {/* foundation line below frame */}
      <line x1="10" y1="52" x2="54" y2="52" strokeWidth="2.0" opacity="0.65" />
      {/* inner offset frame — depth layer */}
      <rect
        x="20" y="22"
        width="24" height="20"
        strokeWidth="1.8"
        opacity="0.6"
      />
      {/* central anchor dot */}
      <circle cx="32" cy="32" r="2.2" fill={color} stroke="none" />
      {/* corner ticks (architect's marks) */}
      <path d="M14 22 L18 22 M14 42 L18 42 M50 22 L46 22 M50 42 L46 42" strokeWidth="1.6" opacity="0.55" />
    </g>
  );
}

function GlyphBurst({ color }: { color: string }) {
  // Spark / Signal — A vertical diamond (prism) with 4 cardinal ray triplets.
  return (
    <g fill="none">
      {/* cardinal ray triplets (small dashes) */}
      {[
        // top
        { x1: 32, y1: 6,  x2: 32, y2: 11 },
        { x1: 28, y1: 8,  x2: 28, y2: 11, w: 1.4 },
        { x1: 36, y1: 8,  x2: 36, y2: 11, w: 1.4 },
        // bottom
        { x1: 32, y1: 53, x2: 32, y2: 58 },
        { x1: 28, y1: 53, x2: 28, y2: 56, w: 1.4 },
        { x1: 36, y1: 53, x2: 36, y2: 56, w: 1.4 },
        // left
        { x1: 6,  y1: 32, x2: 11, y2: 32 },
        { x1: 8,  y1: 28, x2: 11, y2: 28, w: 1.4 },
        { x1: 8,  y1: 36, x2: 11, y2: 36, w: 1.4 },
        // right
        { x1: 53, y1: 32, x2: 58, y2: 32 },
        { x1: 53, y1: 28, x2: 56, y2: 28, w: 1.4 },
        { x1: 53, y1: 36, x2: 56, y2: 36, w: 1.4 },
      ].map((r, i) => (
        <line
          key={i}
          x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={color}
          strokeWidth={r.w ?? 2.2}
          strokeLinecap="round"
          opacity={r.w ? 0.55 : 1}
        />
      ))}
      {/* vertical prism — 2 stacked triangles */}
      <path
        d="M32 17 L42 32 L32 47 L22 32 Z"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.18"
      />
      {/* prism axis */}
      <line x1="22" y1="32" x2="42" y2="32" stroke={color} strokeWidth="1.4" opacity="0.55" />
      {/* core gem */}
      <circle cx="32" cy="32" r="2" fill={color} />
    </g>
  );
}

function GlyphEmber({ color }: { color: string }) {
  // Reactor / Ember — Atomic core: solid nucleus, orbital ring, 3 particles,
  // single flame-tip rising — "active ember" sigil.
  return (
    <g fill="none">
      {/* outer orbital ring (tilted ellipse) */}
      <ellipse
        cx="32" cy="34"
        rx="20" ry="9"
        transform="rotate(-18 32 34)"
        stroke={color}
        strokeWidth="2.0"
        opacity="0.6"
      />
      {/* flame tip rising from nucleus */}
      <path
        d="M32 22 C35 18 35 13 32 8 C29 13 29 18 32 22 Z"
        fill={color}
        fillOpacity="0.7"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* nucleus */}
      <circle cx="32" cy="34" r="5" fill={color} fillOpacity="0.9" />
      <circle cx="32" cy="34" r="2.4" fill="#ffffff" fillOpacity="0.35" />
      {/* orbital particles */}
      <circle cx="12" cy="38" r="2.0" fill={color} />
      <circle cx="52" cy="30" r="2.0" fill={color} />
      <circle cx="42" cy="46" r="1.4" fill={color} opacity="0.7" />
    </g>
  );
}

function GlyphOrbit({ color }: { color: string }) {
  // Drifter / Orbit — A single tilted orbit ring, anchored center node,
  // one bright satellite, and a faint inner micro-orbit for depth.
  return (
    <g fill="none">
      {/* outer orbit ring */}
      <ellipse
        cx="32" cy="32"
        rx="22" ry="11"
        transform="rotate(-22 32 32)"
        stroke={color}
        strokeWidth="2.2"
        opacity="0.85"
      />
      {/* inner micro orbit */}
      <ellipse
        cx="32" cy="32"
        rx="10" ry="5"
        transform="rotate(-22 32 32)"
        stroke={color}
        strokeWidth="1.4"
        opacity="0.35"
      />
      {/* compass cross — anchor reference */}
      <path
        d="M32 22 L32 42 M22 32 L42 32"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* central anchor */}
      <circle cx="32" cy="32" r="3.4" fill={color} />
      <circle cx="32" cy="32" r="1.6" fill="#ffffff" fillOpacity="0.4" />
      {/* satellite on outer ring */}
      <circle cx="50" cy="25" r="2.2" fill={color} />
      {/* trailing dot */}
      <circle cx="14" cy="39" r="1.4" fill={color} opacity="0.55" />
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

/* ──────────────────────────────────────────────────────────────────────────
 * Hex medallion frame — class-emblem ornamentation:
 *  - Outer hex with gradient fill
 *  - Inner highlight hex (top-light reflection)
 *  - 6 vertex dots (rank pips)
 *  - Top notch indicator (class-mark)
 * ────────────────────────────────────────────────────────────────────────── */
function MotifUnderlay({ sigilKey, color }: { sigilKey: SigilKey; color: string }) {
  if (sigilKey === "thrust") {
    return (
      <g opacity="0.28" stroke={color} strokeLinecap="round">
        <path d="M10 44 L28 38" strokeWidth="1.2" />
        <path d="M12 50 L38 42" strokeWidth="1.2" />
        <path d="M36 12 L52 8" strokeWidth="1" opacity="0.6" />
      </g>
    );
  }

  if (sigilKey === "blueprint") {
    return (
      <g opacity="0.2" stroke={color} strokeWidth="0.7">
        <path d="M8 24 H56 M8 40 H56 M24 8 V56 M40 8 V56" />
        <rect x="13" y="13" width="38" height="38" rx="2" fill="none" />
      </g>
    );
  }

  if (sigilKey === "burst") {
    return (
      <g opacity="0.24" stroke={color} strokeLinecap="round">
        <path d="M32 5 V15 M32 49 V59 M5 32 H15 M49 32 H59" strokeWidth="1.2" />
        <path d="M13 13 L20 20 M44 44 L51 51 M51 13 L44 20 M20 44 L13 51" strokeWidth="0.9" />
      </g>
    );
  }

  if (sigilKey === "ember") {
    return (
      <g opacity="0.22" stroke={color} fill="none">
        <circle cx="32" cy="33" r="20" strokeWidth="0.9" />
        <circle cx="32" cy="33" r="13" strokeWidth="0.7" />
        <path d="M18 47 C25 54 39 54 46 47" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g opacity="0.24" stroke={color} fill="none">
      <ellipse cx="32" cy="32" rx="27" ry="13" transform="rotate(-22 32 32)" strokeWidth="0.9" />
      <ellipse cx="32" cy="32" rx="17" ry="8" transform="rotate(18 32 32)" strokeWidth="0.7" />
    </g>
  );
}

function MedallionFrame({
  color,
  gradientId,
  frameId,
}: { color: string; gradientId: string; frameId: string }) {
  // Hex vertices (point-up): top, upper-right, lower-right, bottom, lower-left, upper-left
  const v: Array<[number, number]> = [
    [32, 4],
    [56, 17.5],
    [56, 46.5],
    [32, 60],
    [8, 46.5],
    [8, 17.5],
  ];
  const points = v.map(([x, y]) => `${x},${y}`).join(" ");
  const innerPoints = v.map(([x, y]) => {
    // shrink toward center (32,32) by 7%
    const nx = 32 + (x - 32) * 0.92;
    const ny = 32 + (y - 32) * 0.92;
    return `${nx.toFixed(2)},${ny.toFixed(2)}`;
  }).join(" ");

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={frameId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* fill */}
      <polygon
        points={points}
        fill={`url(#${gradientId})`}
        fillOpacity="0.10"
      />
      {/* outer stroke */}
      <polygon
        points={points}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* inner highlight stroke */}
      <polygon
        points={innerPoints}
        fill="none"
        stroke={`url(#${frameId})`}
        strokeWidth="0.7"
      />
      {/* vertex pips */}
      {v.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="0.9"
          fill={color}
          opacity={i === 0 ? 1 : 0.55}
        />
      ))}
      {/* top class-mark notch */}
      <line x1="29" y1="2" x2="35" y2="2" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
      <line x1="30.5" y1="0" x2="33.5" y2="0" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
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
  const reactId = useId().replace(/:/g, "");
  const uid = `sig-${identity.key.toLowerCase()}-${reactId}`;
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
            inset: -size * 0.2,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${identity.accentRgb},0.36) 0%, rgba(${identity.accentRgb},0) 70%)`,
            filter: "blur(10px)",
            pointerEvents: "none",
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        style={{
          position: "relative",
          zIndex: 1,
          filter: withGlow
            ? `drop-shadow(0 8px 22px rgba(${identity.accentRgb},0.42))`
            : undefined,
        }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={identity.accent} stopOpacity="0.4" />
            <stop offset="100%" stopColor={identity.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* radial backdrop */}
        <circle cx="32" cy="32" r="28" fill={`url(#${glowId})`} />
        <MedallionFrame color={identity.accent} gradientId={gradientId} frameId={frameId} />
        <MotifUnderlay sigilKey={identity.sigilKey} color={identity.accent} />
        <Glyph sigilKey={identity.sigilKey} color={identity.accent} />
      </svg>
    </div>
  );
}

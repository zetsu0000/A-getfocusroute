import type { CSSProperties, ReactNode } from "react";
import { CopyableTemplateBlock } from "@/components/dashboard/CopyableTemplateBlock";
import type { BrainProfileData, RadarDimension } from "@/lib/dashboard/brain-profile";
import type { ExplainScriptBundle } from "@/data/bonuses";
import { SignatureHeroBadge } from "@/components/signature/SignatureHeroBadge";

// ── Geometry helpers (server-computed SVG) ────────────────────────────────────

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

function radarPolygon(dims: RadarDimension[], cx: number, cy: number, r: number): string {
  return dims
    .map((dim, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / dims.length;
      const x = cx + r * (dim.score / 100) * Math.cos(angle);
      const y = cy + r * (dim.score / 100) * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

type LabelInfo = {
  shortLabel: string;
  score: number;
  lx: number;
  ly: number;
  anchor: "start" | "middle" | "end";
  color: string;
};

function computeLabels(dims: RadarDimension[], cx: number, cy: number, lr: number): LabelInfo[] {
  return dims.map((dim, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / dims.length;
    const lx = cx + lr * Math.cos(angle);
    const ly = cy + lr * Math.sin(angle);
    let anchor: "start" | "middle" | "end" = "middle";
    if (lx > cx + 14) anchor = "start";
    else if (lx < cx - 14) anchor = "end";
    const color =
      dim.score >= 65
        ? "var(--color-success)"
        : dim.score >= 40
          ? "var(--color-cognitive)"
          : "var(--color-accent-dark)";
    return { shortLabel: dim.shortLabel, score: dim.score, lx, ly, anchor, color };
  });
}

// ── Small reusable atoms ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "20px 22px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 65
      ? "var(--color-success)"
      : score >= 40
        ? "var(--color-cognitive)"
        : "var(--color-accent-dark)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: "var(--color-bg-card-2)",
          flex: 1,
          overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99 }} />
      </div>
      <span
        style={{ fontSize: 11, fontWeight: 800, color, minWidth: 26, textAlign: "right" }}
      >
        {score}
      </span>
    </div>
  );
}

// ── Executive Function Radar™ ─────────────────────────────────────────────────

function RadarChart({ dimensions }: { dimensions: RadarDimension[] }) {
  const cx = 170, cy = 150, R = 95, LR = 122;

  const rings = [33, 66, 100] as const;
  const axisEnds = dimensions.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / dimensions.length;
    return {
      x: (cx + R * Math.cos(angle)).toFixed(2),
      y: (cy + R * Math.sin(angle)).toFixed(2),
    };
  });

  const dotPositions = dimensions.map((dim, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / dimensions.length;
    return {
      x: (cx + R * (dim.score / 100) * Math.cos(angle)).toFixed(2),
      y: (cy + R * (dim.score / 100) * Math.sin(angle)).toFixed(2),
    };
  });

  const labels = computeLabels(dimensions, cx, cy, LR);
  const filled = radarPolygon(dimensions, cx, cy, R);

  return (
    <svg
      viewBox="0 0 340 300"
      style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }}
      aria-label="Executive Function Radar showing six cognitive dimensions"
    >
      {/* Grid rings */}
      {rings.map(pct => (
        <polygon
          key={pct}
          points={hexPoints(cx, cy, R * pct / 100)}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={pct === 100 ? 1.5 : 1}
          strokeDasharray={pct < 100 ? "3 3" : undefined}
        />
      ))}

      {/* Axis lines */}
      {axisEnds.map((pt, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={pt.x}
          y2={pt.y}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ))}

      {/* Filled polygon */}
      <polygon
        points={filled}
        fill="rgba(76, 63, 215, 0.14)"
        stroke="var(--color-cognitive)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {dotPositions.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={4}
          fill="var(--color-cognitive)"
          stroke="var(--color-bg-card)"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      {labels.map(({ shortLabel, score, lx, ly, anchor, color }) => (
        <g key={shortLabel}>
          <text
            x={lx.toFixed(2)}
            y={ly.toFixed(2)}
            textAnchor={anchor}
            fontSize={9.5}
            fontWeight={700}
            fill="var(--color-text-body)"
          >
            {shortLabel}
          </text>
          <text
            x={lx.toFixed(2)}
            y={(ly + 12).toFixed(2)}
            textAnchor={anchor}
            fontSize={9}
            fontWeight={800}
            fill={color}
          >
            {score}
          </text>
        </g>
      ))}
    </svg>
  );
}

function buildExplainScriptText(bundle: ExplainScriptBundle): string {
  const body = bundle.blocks
    .map(block => `${block.heading}\n\n${block.paragraphs.join("\n\n")}`)
    .join("\n\n---\n\n");

  return `${bundle.opener}\n\n${bundle.openerFollowUp}\n\n---\n\n${body}\n\n---\n\n${bundle.footerNote}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function BrainProfileView({
  profile,
  hasExplainScript,
  explainScriptBundle,
}: {
  profile: BrainProfileData;
  hasExplainScript: boolean;
  explainScriptBundle: ExplainScriptBundle;
}) {
  const levelLabel =
    profile.overallScore >= 68
      ? "Strong overall"
      : profile.overallScore >= 45
        ? "Mixed pattern"
        : "High friction";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* 1 ── Signature Hero */}
      <SignatureHeroBadge
        signatureKey={profile.signatureName}
        signatureName={profile.signatureName}
        signatureTitle={profile.signatureTitle}
        signatureDesc={profile.signatureDesc}
        overallScore={profile.overallScore}
        scoreLabel={levelLabel}
      />

      {/* 2 ── Executive Function Radar™ */}
      <Card>
        <SectionLabel>Executive Function Radar™</SectionLabel>
        <RadarChart dimensions={profile.radarDimensions} />
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
          {profile.radarDimensions.map(dim => (
            <div key={dim.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{ fontSize: 12, color: "var(--color-text-body)", width: 136, flexShrink: 0 }}
              >
                {dim.label}
              </span>
              <ScoreBar score={dim.score} />
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-soft)",
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          Higher = stronger (less friction). Derived from self-reported quiz answers — not a clinical
          assessment.
        </p>
      </Card>

      {/* 3 ── Profile Explanation */}
      <Card>
        <SectionLabel>Cognitive Signature</SectionLabel>
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.72 }}>
          {profile.profileExplanation}
        </p>
      </Card>

      {/* 4 ── Strengths & Friction */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Card>
          <SectionLabel>Strengths</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profile.strengths.map(s => (
              <div key={s.label}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--color-success)",
                    marginBottom: 4,
                  }}
                >
                  Strength: {s.label}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.55 }}>
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionLabel>Friction Points</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profile.frictionPoints.map(f => (
              <div key={f.label}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--color-accent-dark)",
                    marginBottom: 4,
                  }}
                >
                  Friction: {f.label}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.55 }}>
                  {f.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5 ── Best Focus Conditions */}
      <Card>
        <SectionLabel>Best Focus Conditions</SectionLabel>
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {profile.focusConditions.map((condition, i) => (
            <li
              key={i}
              style={{
                fontSize: 13,
                color: "var(--color-text-body)",
                lineHeight: 1.62,
                paddingLeft: 18,
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: "var(--color-signal)",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                •
              </span>
              {condition}
            </li>
          ))}
        </ul>
      </Card>

      {/* 6 ── Working Style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Card>
          <SectionLabel>Task Initiation Style</SectionLabel>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.68 }}>
            {profile.initiationStyle}
          </p>
        </Card>
        <Card>
          <SectionLabel>Recovery Style</SectionLabel>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.68 }}>
            {profile.distractionRecovery}
          </p>
        </Card>
      </div>

      {/* 7 ── "Finally, an explanation" */}
      <Card
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-2)",
        }}
      >
        <p
          style={{
            fontSize: 19,
            fontWeight: 900,
            color: "var(--color-text)",
            marginBottom: 18,
            lineHeight: 1.22,
            letterSpacing: "-0.015em",
          }}
        >
          &ldquo;Finally, an explanation.&rdquo;
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {profile.finallyExplanation.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 14,
                color: "var(--color-text-body)",
                lineHeight: 1.72,
                padding: i > 0 ? "12px 14px" : 0,
                border: i > 0 ? "1px solid var(--color-border)" : "none",
                borderRadius: i > 0 ? 12 : 0,
                background: i > 0 ? "var(--color-bg-card-2)" : "transparent",
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </Card>

      {/* 8 ── Explain-It-To-Someone Script (conditional) */}
      {hasExplainScript && (
        <Card>
          <SectionLabel>Explain-It-To-Someone Script™</SectionLabel>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: 4,
            }}
          >
            {explainScriptBundle.title}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              lineHeight: 1.55,
              marginBottom: 16,
            }}
          >
            {explainScriptBundle.subtitle}
          </p>

          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: "var(--color-cognitive-tint)",
              border: "1px solid var(--color-border)",
              marginBottom: 18,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-cognitive-dark)",
                lineHeight: 1.55,
                marginBottom: 6,
              }}
            >
              &ldquo;{explainScriptBundle.opener}&rdquo;
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.58 }}>
              {explainScriptBundle.openerFollowUp}
            </p>
          </div>

          <CopyableTemplateBlock
            label="Copy opening lines"
            text={`${explainScriptBundle.opener}\n\n${explainScriptBundle.openerFollowUp}`}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {explainScriptBundle.blocks.map((block, i) => (
              <details
                key={i}
                open={i === 0}
                style={{
                  borderRadius: 14,
                  background: "var(--color-bg-card-2)",
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                    padding: "13px 15px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--color-text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {block.heading}
                </summary>
                <div style={{ padding: "0 15px 15px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {block.paragraphs.map((para, j) => (
                    <p
                      key={j}
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-body)",
                        lineHeight: 1.68,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <CopyableTemplateBlock label="Copy full script" text={buildExplainScriptText(explainScriptBundle)} />
          </div>

          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 16,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            {explainScriptBundle.footerNote}
          </p>
        </Card>
      )}
    </div>
  );
}

import type { CSSProperties } from "react";
import Link from "next/link";

import { ROADMAP_DAYS } from "@/data/roadmap";

// ── Phase definitions ─────────────────────────────────────────────────────────

const PHASES = [
  {
    id: 1,
    name: "Map",
    theme: "Stabilize & reduce friction",
    desc: "Discover your patterns. Choose one lane. Lower the activation cost of starting.",
    color: "var(--color-primary)",
    tint: "var(--color-primary-tint)",
    border: "var(--color-primary)",
    days: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: 2,
    name: "Stabilize",
    theme: "Environment & attention anchors",
    desc: "Anchor routines. Design your environment. Build resets that hold on hard days.",
    color: "var(--color-cognitive)",
    tint: "var(--color-cognitive-tint)",
    border: "var(--color-cognitive)",
    days: [8, 9, 10, 11, 12, 13, 14],
  },
  {
    id: 3,
    name: "Build",
    theme: "Execution loops & recovery",
    desc: "Strengthen execution habits. Practice returning after disruption. Reduce context-switching costs.",
    color: "var(--color-success)",
    tint: "var(--color-success-tint)",
    border: "var(--color-success)",
    days: [15, 16, 17, 18, 19, 20, 21],
  },
  {
    id: 4,
    name: "Practice",
    theme: "Consolidate & sustain",
    desc: "Consolidate what works. Build maintenance habits. Close the loop without a crash.",
    color: "var(--color-accent-dark)",
    tint: "var(--color-accent-tint)",
    border: "var(--color-accent-dark)",
    days: [22, 23, 24, 25, 26, 27, 28],
  },
] as const;

// ── Atoms ─────────────────────────────────────────────────────────────────────

const fieldLabel: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: 5,
};

const bodyText: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-body)",
  lineHeight: 1.68,
  margin: 0,
};

// ── Phase progress strip ──────────────────────────────────────────────────────

function PhaseProgressStrip({ locked }: { locked: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        overflowX: "auto",
        paddingBottom: 2,
      }}
    >
      {PHASES.map((phase, i) => (
        <div key={phase.id} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              flex: "0 0 auto",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: locked ? "var(--color-bg-card-2)" : phase.tint,
                border: "2px solid " + (locked ? "var(--color-border)" : phase.color),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                color: locked ? "var(--color-text-muted)" : phase.color,
              }}
            >
              {locked ? "?" : phase.id}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: locked ? "var(--color-text-muted)" : phase.color,
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {phase.name}
            </span>
          </div>
          {i < PHASES.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: locked ? "var(--color-border)" : "var(--color-border-2)",
                margin: "0 4px",
                marginBottom: 18,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Day card ──────────────────────────────────────────────────────────────────

function DayCard({
  dayNum,
  phaseColor,
  phaseTint,
}: {
  dayNum: number;
  phaseColor: string;
  phaseTint: string;
}) {
  const day = ROADMAP_DAYS[dayNum - 1];
  if (!day) return null;

  return (
    <details
      style={{
        borderRadius: 14,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Day badge */}
        <span
          style={{
            flexShrink: 0,
            width: 30,
            height: 30,
            borderRadius: 8,
            background: phaseTint,
            border: "1px solid " + phaseColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 900,
            color: phaseColor,
          }}
        >
          {dayNum}
        </span>

        {/* Title */}
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--color-text)",
            lineHeight: 1.35,
          }}
        >
          {day.title}
        </span>

        {/* Time chip */}
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            background: "var(--color-bg-card-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 99,
            padding: "3px 9px",
            whiteSpace: "nowrap",
          }}
        >
          {day.estimatedTime}
        </span>
      </summary>

      {/* Expanded content */}
      <div
        style={{
          padding: "4px 16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ paddingTop: 14 }}>
          <p style={fieldLabel}>Objective</p>
          <p style={bodyText}>{day.objective}</p>
        </div>
        <div
          style={{
            borderRadius: 10,
            padding: "12px 14px",
            background: phaseTint,
            border: "1px solid " + phaseColor + "33",
          }}
        >
          <p style={{ ...fieldLabel, color: phaseColor }}>Micro-Action</p>
          <p style={{ ...bodyText, fontWeight: 600 }}>{day.microAction}</p>
        </div>
        <div>
          <p style={fieldLabel}>Why It Works</p>
          <p style={bodyText}>{day.whyItWorks}</p>
        </div>
        <div
          style={{
            borderLeft: "3px solid var(--color-border-2)",
            paddingLeft: 12,
          }}
        >
          <p style={fieldLabel}>Reflection</p>
          <p style={{ ...bodyText, fontStyle: "italic" }}>{day.reflectionPrompt}</p>
        </div>
      </div>
    </details>
  );
}

// ── Phase section ─────────────────────────────────────────────────────────────

function PhaseSection({
  phase,
}: {
  phase: (typeof PHASES)[number];
}) {
  return (
    <section>
      {/* Phase header */}
      <div
        style={{
          borderRadius: 14,
          padding: "16px 18px",
          background: phase.tint,
          border: "1px solid " + phase.color + "44",
          marginBottom: 12,
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--color-bg-card)",
            border: "2px solid " + phase.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 900,
            color: phase.color,
          }}
        >
          {phase.id}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <p
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "var(--color-text)",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {phase.name}
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: phase.color,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Days {phase.days[0]}–{phase.days[phase.days.length - 1]}
            </p>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              marginTop: 2,
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            {phase.theme}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.55 }}>
            {phase.desc}
          </p>
        </div>
      </div>

      {/* Day cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {phase.days.map(dayNum => (
          <DayCard
            key={dayNum}
            dayNum={dayNum}
            phaseColor={phase.color}
            phaseTint={phase.tint}
          />
        ))}
      </div>
    </section>
  );
}

// ── Locked preview ────────────────────────────────────────────────────────────

export function LockedRoadmapPreview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            marginBottom: 8,
          }}
        >
          28-Day Protocol™ · FocusRoute Brain OS™
        </p>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--color-text)",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Your full protocol is one step away.
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>
          28 micro-actions across 4 phases — Map, Stabilize, Build, Practice — each with a clear
          objective, a single micro-action, and a reflection prompt.
        </p>
      </div>

      <PhaseProgressStrip locked />

      {/* Locked phase previews */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PHASES.map(phase => (
          <div
            key={phase.id}
            style={{
              borderRadius: 14,
              padding: "14px 16px",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: 0.82,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "var(--color-bg-card-2)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              🔒
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 2 }}>
                Phase {phase.id}: {phase.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                {phase.desc}
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "var(--color-text-muted)",
              }}
            >
              7 days
            </span>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      <div
        style={{
          borderRadius: 16,
          padding: "22px 22px",
          background: "linear-gradient(135deg, var(--color-primary-tint), var(--color-cognitive-tint))",
          border: "1px solid var(--color-border)",
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
          Unlock the 28-Day Protocol™
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-body)",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Get your full roadmap with day-by-day micro-actions calibrated to your Brain Profile.
          Skip or swap days — the protocol fits your pace, not the other way around.
        </p>
        <Link
          href="/dashboard/upgrade?need=roadmap_28_day"
          prefetch={false}
          style={{
            display: "inline-flex",
            padding: "12px 22px",
            borderRadius: 12,
            background: "var(--color-accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "var(--shadow-btn-accent)",
          }}
        >
          Add the 28-Day Protocol
        </Link>
      </div>
    </div>
  );
}

// ── Disclaimer ────────────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: "14px 16px",
        background: "var(--color-bg-card-2)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 6,
        }}
      >
        About this protocol
      </p>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        This is a practical self-organisation resource, not a medical programme. It is not a substitute
        for clinical diagnosis, therapy, or medication guidance. Skip or swap days when life requires
        it — the protocol is designed to support your pace, not score it. If you work with a
        therapist, coach, or psychiatrist, this material is intended to complement that support.
      </p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RoadmapProtocolView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <header>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            marginBottom: 8,
          }}
        >
          28-Day Protocol™ · FocusRoute Brain OS™
        </p>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--color-text)",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          28-Day Protocol
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65, maxWidth: 560 }}>
          Four phases. One micro-action per day. Tap any day to expand the objective, action, and
          reflection. Skip or swap — the protocol is here to support your pace, not enforce it.
        </p>
      </header>

      {/* Phase progress strip */}
      <PhaseProgressStrip locked={false} />

      {/* Phases */}
      {PHASES.map(phase => (
        <PhaseSection key={phase.id} phase={phase} />
      ))}

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}

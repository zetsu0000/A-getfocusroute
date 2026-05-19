import type { CSSProperties } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { CopyableTemplateBlock } from "@/components/dashboard/CopyableTemplateBlock";
import type { ExplainScriptBundle, ToolkitItem } from "@/data/bonuses";
import { ADHD_TOOLKIT_ITEMS, FOCUS_AUDIO_SESSIONS } from "@/data/bonuses";

// ── Design tokens ─────────────────────────────────────────────────────────────

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

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURED_TOOLKIT_IDS = [
  "daily-sprint-planner",
  "brain-dump-converter",
  "weekly-reset-ritual",
  "body-doubling-session-sheet",
];

const featuredItems = ADHD_TOOLKIT_ITEMS.filter(item =>
  FEATURED_TOOLKIT_IDS.includes(item.id),
);

// ── Locked card ───────────────────────────────────────────────────────────────

function LockedCard({
  category,
  categoryColor,
  title,
  tagline,
  includedWith,
  upgradeNeed,
}: {
  category: string;
  categoryColor: string;
  title: string;
  tagline: string;
  includedWith: string;
  upgradeNeed: string;
}) {
  const ctaLabel = upgradeNeed === "roadmap_28_day" ? "Add 28-Day Protocol" : "Unlock Brain Profile";
  const ctaHref = upgradeNeed === "roadmap_28_day"
    ? "/roadmap"
    : `/dashboard/upgrade?need=${encodeURIComponent(upgradeNeed)}`;
  return (
    <div
      style={{
        borderRadius: 18,
        background: "linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-card-2) 100%)",
        border: "1px solid var(--color-border-2)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--color-accent-tint)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LockKeyhole size={17} color="var(--color-accent)" strokeWidth={2.4} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: categoryColor,
              marginBottom: 5,
            }}
          >
            {category}
          </span>
          <p
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 4,
              lineHeight: 1.25,
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{tagline}</p>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "12px 20px",
          background: "var(--color-bg-card-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
          Included with the <strong style={{ color: "var(--color-text-body)" }}>{includedWith}</strong>.
        </p>
        <Link
          href={ctaHref}
          prefetch={false}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-accent)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            background: "var(--color-accent-tint)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "8px 11px",
          }}
        >
          {ctaLabel} →
        </Link>
      </div>
    </div>
  );
}

// ── Unlocked card wrapper ─────────────────────────────────────────────────────

function UnlockedCard({
  category,
  categoryColor,
  title,
  tagline,
  children,
}: {
  category: string;
  categoryColor: string;
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <details
      style={{
        borderRadius: 18,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          padding: "18px 20px",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: categoryColor,
              marginBottom: 5,
            }}
          >
            {category}
          </span>
          <p
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 4,
              lineHeight: 1.25,
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45 }}>{tagline}</p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-primary)",
            background: "var(--color-primary-tint)",
            border: "1px solid var(--color-border)",
            borderRadius: 99,
            padding: "4px 10px",
            marginTop: 2,
            whiteSpace: "nowrap",
          }}
        >
          Open ↓
        </span>
      </summary>
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px 20px" }}>
        {children}
      </div>
    </details>
  );
}

// ── Explain-It Script content ─────────────────────────────────────────────────

function buildFullScriptText(bundle: ExplainScriptBundle): string {
  const body = bundle.blocks
    .map(b => `${b.heading}\n\n${b.paragraphs.join("\n\n")}`)
    .join("\n\n---\n\n");
  return `${bundle.opener}\n\n${bundle.openerFollowUp}\n\n---\n\n${body}\n\n---\n\n${bundle.footerNote}`;
}

function ExplainScriptContent({ bundle }: { bundle: ExplainScriptBundle }) {
  const sectionNames = [
    "What it feels like",
    "What helps",
    "What I'm not saying",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ ...bodyText, color: "var(--color-text-muted)", fontSize: 12 }}>
        Your Cognitive Signature™ appears when your latest saved assessment includes a named pattern. It&apos;s
        a shorthand for your self-reported style — not a clinical label.
      </p>

      <div
        style={{
          borderRadius: 12,
          padding: "14px 16px",
          background: "var(--color-primary-tint)",
          border: "1px solid var(--color-border)",
        }}
      >
        <p style={{ ...fieldLabel, color: "var(--color-primary)" }}>Opening lines</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-primary-dark)", lineHeight: 1.6 }}>
          &ldquo;{bundle.opener}&rdquo;
        </p>
        <p style={{ ...bodyText, marginTop: 8, fontSize: 12, color: "var(--color-text-body)" }}>
          {bundle.openerFollowUp}
        </p>
      </div>

      <CopyableTemplateBlock
        label="Copy opening lines"
        text={`${bundle.opener}\n\n${bundle.openerFollowUp}`}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {bundle.blocks.map((block, idx) => (
          <details
            key={block.heading}
            style={{
              borderRadius: 12,
              background: "var(--color-bg-card-2)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                listStyle: "none",
                padding: "12px 14px",
                fontSize: 12,
                fontWeight: 800,
                color: "var(--color-text)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {sectionNames[idx] ?? block.heading}
            </summary>
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {block.paragraphs.map((para, i) => (
                <p key={i} style={bodyText}>
                  {para}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>

      <CopyableTemplateBlock label="Copy full script" text={buildFullScriptText(bundle)} />

      <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.55, fontStyle: "italic" }}>
        {bundle.footerNote}
      </p>
    </div>
  );
}

// ── Toolkit item content ──────────────────────────────────────────────────────

function ToolkitItemContent({ item }: { item: ToolkitItem }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <p style={fieldLabel}>Purpose</p>
        <p style={bodyText}>{item.purpose}</p>
      </div>
      <div
        style={{
          borderRadius: 10,
          padding: "12px 14px",
          background: "var(--color-cognitive-tint)",
          border: "1px solid var(--color-border)",
        }}
      >
        <p style={{ ...fieldLabel, color: "var(--color-cognitive-dark)" }}>How to use</p>
        <p style={{ ...bodyText, fontWeight: 600 }}>{item.howToUse}</p>
      </div>
      <CopyableTemplateBlock label="Copy template" text={item.templateText} />
    </div>
  );
}

// ── Audio session content ─────────────────────────────────────────────────────

function AudioSection() {
  return (
    <section>
      <div style={{ marginBottom: 12 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "var(--color-success)",
            marginBottom: 4,
          }}
        >
          Bonus · Session Guides
        </p>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "var(--color-text)",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          Focus Session Guides
        </h3>
        <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6 }}>
          Pair with your own sound or silence. Session guides — not therapy or treatment.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FOCUS_AUDIO_SESSIONS.map(session => (
          <details
            key={session.id}
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
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                {session.title}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 99,
                  background: "var(--color-success-tint)",
                  color: "var(--color-success)",
                  border: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                {session.duration}
              </span>
            </summary>
            <div
              style={{
                padding: "4px 16px 16px",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ paddingTop: 12 }}>
                <p style={fieldLabel}>When to use</p>
                <p style={bodyText}>{session.whenToUse}</p>
              </div>
              <div
                style={{
                  borderRadius: 10,
                  padding: "11px 13px",
                  background: "var(--color-success-tint)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p style={{ ...fieldLabel, color: "var(--color-success)" }}>Opening prompt</p>
                <p style={{ ...bodyText, fontStyle: "italic" }}>{session.openingPrompt}</p>
              </div>
              <div>
                <p style={fieldLabel}>Outcome</p>
                <p style={bodyText}>{session.outcome}</p>
              </div>
              {session.arc && session.arc.length > 0 && (
                <div>
                  <p style={fieldLabel}>Optional timing arc</p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {session.arc.map((line, i) => (
                      <li key={i} style={{ ...bodyText, marginBottom: i < session.arc!.length - 1 ? 6 : 0 }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function BonusLibraryView({
  hasExplainScript,
  hasToolkit,
  hasAudio,
  explainScriptBundle,
}: {
  hasExplainScript: boolean;
  hasToolkit: boolean;
  hasAudio: boolean;
  explainScriptBundle: ExplainScriptBundle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

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
          Bonus Library · FocusRoute Brain OS™
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
          Bonuses
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65, maxWidth: 580 }}>
          Structured guides and templates you can use immediately. Each stands alone — pick the one
          that fits today&apos;s need. Tap to expand unlocked content.
        </p>
      </header>

      {/* 1 — Explain-It-To-Someone Script */}
      {hasExplainScript ? (
        <UnlockedCard
          category="Communication"
          categoryColor="var(--color-primary)"
          title={explainScriptBundle.title}
          tagline={explainScriptBundle.subtitle}
        >
          <ExplainScriptContent bundle={explainScriptBundle} />
        </UnlockedCard>
      ) : (
        <LockedCard
          category="Communication"
          categoryColor="var(--color-primary)"
          title="Explain-It-To-Someone Script"
          tagline="A calm template for describing how your brain handles focus and follow-through — without over-explaining."
          includedWith="Brain Profile purchase"
          upgradeNeed="brain_profile"
        />
      )}

      {/* 2–5 — Toolkit items */}
      {featuredItems.map(item =>
        hasToolkit ? (
          <UnlockedCard
            key={item.id}
            category="Toolkit"
            categoryColor="var(--color-cognitive)"
            title={item.title}
            tagline={item.tagline}
          >
            <ToolkitItemContent item={item} />
          </UnlockedCard>
        ) : (
          <LockedCard
            key={item.id}
            category="Toolkit"
            categoryColor="var(--color-cognitive)"
            title={item.title}
            tagline={item.tagline}
            includedWith="28-Day Protocol purchase"
            upgradeNeed="roadmap_28_day"
          />
        ),
      )}

      {/* 6 — Audio / Session guides */}
      {hasAudio ? (
        <AudioSection />
      ) : (
        <LockedCard
          category="Session Guides"
          categoryColor="var(--color-success)"
          title="Focus Session Guides"
          tagline="Four structured session formats — 8 to 25 minutes — for starting, sprinting, resetting, and shutting down."
          includedWith="28-Day Protocol purchase"
          upgradeNeed="roadmap_28_day"
        />
      )}

      {/* Back link */}
      <Link
        href="/dashboard"
        prefetch={false}
        style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}
      >
        ← Back to overview
      </Link>
    </div>
  );
}

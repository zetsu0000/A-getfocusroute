import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CornerDownRight } from "lucide-react";

import { DisplayNameForm } from "@/components/dashboard/DisplayNameForm";
import { RetakeQuizCard } from "@/components/dashboard/RetakeQuizCard";
import { SectionEyebrow } from "@/components/dashboard/DashboardPrimitives";
import type { LoggedInDashboardSnapshot } from "@/lib/dashboard/load-dashboard-context";
import { hasBrainProfileAccess, hasRoadmapAccess } from "@/lib/dashboard/unlock";
import {
  FOCUS_PATTERN,
  FOCUS_ROUTE_WEEKS,
  FOCUS_TOOLS,
  POST_PURCHASE_SECTIONS,
  RETAKE_QUIZ,
  TODAYS_FOCUS_MOVE,
} from "@/lib/dashboard/post-purchase-content";

const FOCUS_TOOLS_ANCHOR = "focus-tools";

/* Shared card shell — one consistent, scannable surface in both themes. */
const cardStyle = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 16,
  boxShadow: "var(--shadow-card)",
} as const;

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 19,
        fontWeight: 900,
        color: "var(--color-text)",
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h2>
  );
}

function AccessLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 800,
        color: "var(--color-signal)",
        textDecoration: "none",
      }}
    >
      {label} <ArrowUpRight size={14} strokeWidth={2.4} />
    </Link>
  );
}

/* 1 — Today's Focus Move: the first, immediately useful action. */
function TodaysFocusMove() {
  return (
    <section
      aria-labelledby="todays-move-heading"
      style={{
        ...cardStyle,
        border: "1px solid var(--color-border-2)",
        boxShadow: "var(--shadow-card-strong)",
        padding: "18px 18px",
        background: "linear-gradient(180deg,var(--color-bg-card),var(--color-bg-card-2))",
      }}
    >
      <SectionEyebrow>{TODAYS_FOCUS_MOVE.eyebrow}</SectionEyebrow>
      <h1
        id="todays-move-heading"
        style={{ fontSize: 21, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.22, marginBottom: 8 }}
      >
        {TODAYS_FOCUS_MOVE.title}
      </h1>
      <p style={{ fontSize: 14.5, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 14 }}>
        {TODAYS_FOCUS_MOVE.lead}
      </p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        {TODAYS_FOCUS_MOVE.steps.map((step, i) => (
          <li key={step} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 7,
                background: "var(--color-accent-tint)",
                border: "1px solid var(--color-border)",
                color: "var(--color-accent)",
                fontSize: 12,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.5 }}>{step}</span>
          </li>
        ))}
      </ol>
      <a
        href={`#${FOCUS_TOOLS_ANCHOR}`}
        style={{
          marginTop: 16,
          width: "100%",
          padding: "13px 18px",
          borderRadius: 12,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "var(--shadow-btn-primary)",
        }}
      >
        {TODAYS_FOCUS_MOVE.cta} <ArrowRight size={15} strokeWidth={2.5} />
      </a>
    </section>
  );
}

/* 2 — Focus Tools: repeatable, named tools presented as reusable cards. */
function FocusTools() {
  return (
    <section id={FOCUS_TOOLS_ANCHOR} aria-labelledby="focus-tools-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <SectionEyebrow>Use these whenever focus slips</SectionEyebrow>
        <SectionHeading><span id="focus-tools-heading">{POST_PURCHASE_SECTIONS.focusTools}</span></SectionHeading>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {FOCUS_TOOLS.map((tool) => (
          <div key={tool.name} style={{ ...cardStyle, padding: "14px 15px" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--color-text)", marginBottom: 6 }}>{tool.name}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-signal)", lineHeight: 1.5, marginBottom: 4 }}>
              {tool.useWhen}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--color-text-body)", lineHeight: 1.55 }}>{tool.gain}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* 3 — 28-Day FocusRoute: ongoing value beyond day one. */
function TwentyEightDayRoute({ roadmapOpen }: { roadmapOpen: boolean }) {
  return (
    <section aria-labelledby="route-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <SectionEyebrow>Your four-week route</SectionEyebrow>
        <SectionHeading><span id="route-heading">{POST_PURCHASE_SECTIONS.route}</span></SectionHeading>
      </div>
      <div style={{ ...cardStyle, padding: "6px 16px" }}>
        {FOCUS_ROUTE_WEEKS.map((week, i) => (
          <div
            key={week.label}
            style={{
              padding: "13px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: 14.5, fontWeight: 800, color: "var(--color-text)", marginBottom: 3 }}>{week.label}</p>
            <p style={{ fontSize: 13.5, color: "var(--color-text-body)", lineHeight: 1.55 }}>{week.benefit}</p>
          </div>
        ))}
      </div>
      <AccessLink
        href={roadmapOpen ? "/dashboard/roadmap" : "/roadmap"}
        label={roadmapOpen ? "Open your 28-day route" : "See what the 28-day route covers"}
      />
    </section>
  );
}

/* 4 — Your Focus Pattern: concise, practical, plain-language framing. */
function FocusPattern({ patternName, profileOpen }: { patternName: string; profileOpen: boolean }) {
  return (
    <section aria-labelledby="pattern-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <SectionEyebrow>How you focus best</SectionEyebrow>
        <SectionHeading><span id="pattern-heading">{POST_PURCHASE_SECTIONS.focusPattern}</span></SectionHeading>
      </div>
      <div style={{ ...cardStyle, padding: "15px 16px" }}>
        {patternName && (
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              color: "var(--color-accent)",
              background: "var(--color-accent-tint)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              padding: "3px 10px",
              marginBottom: 10,
            }}
          >
            {patternName}
          </span>
        )}
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.6 }}>{FOCUS_PATTERN.intro}</p>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {FOCUS_PATTERN.cards.map((card) => (
          <div key={card.title} style={{ ...cardStyle, padding: "14px 15px" }}>
            <p style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 5 }}>
              <CornerDownRight size={14} color="var(--color-accent)" strokeWidth={2.4} />
              {card.title}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--color-text-body)", lineHeight: 1.55 }}>{card.body}</p>
          </div>
        ))}
      </div>
      <AccessLink
        href={profileOpen ? "/dashboard/profile" : "/dashboard/upgrade?need=brain_profile"}
        label="See your full focus pattern"
      />
    </section>
  );
}

export function DashboardHomeView({ snap }: { snap: LoggedInDashboardSnapshot }) {
  const u = snap.entitlementSet;
  const profileOpen = hasBrainProfileAccess(u);
  const roadmapOpen = hasRoadmapAccess(u);

  const storedDisplayName = snap.profile?.full_name?.trim() || "";
  const patternName =
    typeof snap.latestQuizResult?.signature_name === "string"
      ? snap.latestQuizResult.signature_name.trim()
      : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 560, margin: "0 auto" }}>
      <TodaysFocusMove />
      <FocusTools />
      <TwentyEightDayRoute roadmapOpen={roadmapOpen} />
      <FocusPattern patternName={patternName} profileOpen={profileOpen} />

      <section aria-label={RETAKE_QUIZ.title}>
        <RetakeQuizCard email={snap.user.email} displayName={storedDisplayName} />
      </section>

      {/* Slim account footer — keeps display-name + billing reachable without
          re-introducing a dense panel at the top of the dashboard. */}
      <section style={{ ...cardStyle, padding: "15px 16px" }}>
        <SectionEyebrow>Your account</SectionEyebrow>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--color-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            marginBottom: 12,
          }}
        >
          {snap.user.email}
        </p>
        <DisplayNameForm initialName={storedDisplayName} />
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
          <AccessLink href="/dashboard/membership" label="Manage membership & billing" />
        </div>
      </section>

      <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5, textAlign: "center" }}>
        Your access is managed securely on your account.
      </p>
    </div>
  );
}

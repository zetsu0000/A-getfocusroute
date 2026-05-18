import Link from "next/link";
import { Crown } from "lucide-react";

import { DashboardMembershipSummary } from "@/components/dashboard/DashboardMembershipSummary";
import type { DashboardSubscriptionRow } from "@/lib/dashboard/load-dashboard-context";

// ── Shared atoms ──────────────────────────────────────────────────────────────

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "20px 22px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {eyebrow && (
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </p>
      )}
      <p
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "var(--color-text)",
          marginBottom: 12,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

const bodyText = {
  fontSize: 13,
  color: "var(--color-text-body)",
  lineHeight: 1.68,
  margin: 0,
} as const;

const fieldLabel = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: 5,
} as const;

// ── Locked state ──────────────────────────────────────────────────────────────

export function LockedMembership() {
  const features = [
    "Retake the assessment whenever your context shifts",
    "Monthly Reset — structured monthly reflection prompts",
    "Focus System Updates — protocol and library improvements",
    "Full access to Brain Profile and 28-Day Protocol library",
    "Billing portal access to manage your plan",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          borderRadius: 18,
          padding: "24px 22px",
          background:
            "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-cognitive-tint) 100%)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crown size={20} color="var(--color-primary)" />
          </div>
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
                marginBottom: 3,
              }}
            >
              FocusRoute Membership
            </p>
            <p style={{ fontSize: 17, fontWeight: 900, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
              Ongoing access to your Brain OS
            </p>
          </div>
        </div>

        <p style={{ ...bodyText, marginBottom: 18 }}>
          Membership keeps your focus system active — with retakes, monthly resets, and protocol
          updates built around how your brain actually changes over time.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
          {features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 1,
                  fontSize: 13,
                  color: "var(--color-primary)",
                  fontWeight: 800,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/upgrade?need=membership"
          prefetch={false}
          style={{
            display: "inline-flex",
            padding: "13px 24px",
            borderRadius: 12,
            background: "var(--color-primary)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          See membership options
        </Link>
      </div>
    </div>
  );
}

// ── Member area sections ──────────────────────────────────────────────────────

const MONTHLY_RESET_PROMPTS = [
  {
    q: "What worked in your focus system this month — even if imperfectly?",
    hint: "Name one habit, environment design, or reset that held up under real conditions.",
  },
  {
    q: "Where did friction show up most consistently?",
    hint: "Look for a time-of-day pattern, a task type, or an environmental factor — not a character flaw.",
  },
  {
    q: "What's one lane you want to carry into next month?",
    hint: "One sentence. Not a system overhaul.",
  },
  {
    q: "What would you adjust if you could change one thing about how your week is structured?",
    hint: "Concrete and small. Write it down even if you're not sure you'll do it.",
  },
];

const SYSTEM_UPDATES = [
  {
    label: "Brain Profile",
    update:
      "Executive Function Radar™ added — six dimensions (initiation, focus, memory, planning, priority, regulation) visualised from your assessment answers.",
  },
  {
    label: "28-Day Protocol",
    update:
      "Phase structure introduced — protocol now organised into Map, Stabilize, Build, and Practice phases with colour-coded day cards.",
  },
  {
    label: "Bonus Library",
    update:
      "Individual card layout — each bonus now has its own locked/unlocked card with per-entitlement access display.",
  },
];

function MonthlyReset() {
  return (
    <SectionCard eyebrow="Member · Monthly" title="Monthly Reset">
      <p style={{ ...bodyText, marginBottom: 16 }}>
        A short monthly reflection to recalibrate your system. Set a 20–30 minute block, answer
        the prompts in writing, and adjust one thing.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MONTHLY_RESET_PROMPTS.map((item, i) => (
          <div
            key={i}
            style={{
              borderRadius: 12,
              padding: "13px 14px",
              background: "var(--color-bg-card-2)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 4, lineHeight: 1.45 }}>
              {i + 1}. {item.q}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {item.hint}
            </p>
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          marginTop: 14,
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        Aim for once a month. Skip months without guilt — return when it feels useful.
      </p>
    </SectionCard>
  );
}

function RetakeAssessment({ hasRetakeQuiz }: { hasRetakeQuiz: boolean }) {
  return (
    <SectionCard eyebrow="Member · Retake" title="Retake Assessment">
      <p style={{ ...bodyText, marginBottom: 14 }}>
        Your Brain Profile reflects where you were when you took the assessment. Retake it when
        your life context shifts significantly — new role, new season, new support system.
      </p>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.55, marginBottom: 16 }}>
        The assessment takes about 3 minutes. Your new results will update your Brain Profile and
        generate a fresh Cognitive Signature™.
      </p>
      {hasRetakeQuiz ? (
        <Link
          href="/"
          prefetch={false}
          style={{
            display: "inline-flex",
            padding: "11px 20px",
            borderRadius: 12,
            background: "var(--color-primary)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Start retake →
        </Link>
      ) : (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>
          Retake access is included with active membership. If you see this, contact support.
        </p>
      )}
    </SectionCard>
  );
}

function FocusSystemUpdates() {
  return (
    <SectionCard eyebrow="Member · Updates" title="Focus System Updates">
      <p style={{ ...bodyText, marginBottom: 16 }}>
        What has changed in the FocusRoute Brain OS™ — protocol improvements, library additions, and
        profile refinements.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SYSTEM_UPDATES.map(item => (
          <div
            key={item.label}
            style={{
              borderRadius: 12,
              padding: "12px 14px",
              background: "var(--color-bg-card-2)",
              border: "1px solid var(--color-border)",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-cognitive)",
                background: "var(--color-cognitive-tint)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                padding: "2px 7px",
                marginTop: 1,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
            <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.55 }}>
              {item.update}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function MemberResources() {
  const links = [
    { label: "Brain Profile", desc: "Your Cognitive Signature™ and Executive Function Radar™", href: "/dashboard/profile" },
    { label: "28-Day Protocol", desc: "Four phases of daily micro-actions", href: "/dashboard/roadmap" },
    { label: "Bonus Library", desc: "Scripts, planners, and session guides", href: "/dashboard/bonuses" },
  ];

  return (
    <SectionCard eyebrow="Member · Library" title="Member Resources">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map(item => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              borderRadius: 12,
              padding: "12px 14px",
              background: "var(--color-bg-card-2)",
              border: "1px solid var(--color-border)",
              textDecoration: "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{item.desc}</p>
            </div>
            <span style={{ fontSize: 14, color: "var(--color-primary)", flexShrink: 0 }}>→</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

function AccountBilling({ email }: { email: string }) {
  return (
    <SectionCard eyebrow="Member · Account" title="Account & Billing">
      <p style={{ ...bodyText, marginBottom: 14 }}>
        To change your plan, update payment details, or cancel your subscription, email support
        with your account address and we will handle it within one business day.
      </p>
      <div
        style={{
          borderRadius: 12,
          padding: "12px 14px",
          background: "var(--color-bg-card-2)",
          border: "1px solid var(--color-border)",
          marginBottom: 14,
        }}
      >
        <p style={fieldLabel}>Account email</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-body)" }}>{email}</p>
      </div>
      <a
        href="mailto:support@focusroute.com"
        style={{
          display: "inline-flex",
          padding: "10px 18px",
          borderRadius: 10,
          background: "var(--color-bg-card-2)",
          border: "1px solid var(--color-border)",
          color: "var(--color-primary)",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Email support →
      </a>
    </SectionCard>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MembershipView({
  hasRetakeQuiz,
  subscriptions,
  email,
}: {
  hasRetakeQuiz: boolean;
  subscriptions: DashboardSubscriptionRow[];
  email: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
          FocusRoute Membership
        </p>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
          }}
        >
          Member Area
        </h2>
      </header>

      <DashboardMembershipSummary subscriptions={subscriptions} />
      <MonthlyReset />
      <RetakeAssessment hasRetakeQuiz={hasRetakeQuiz} />
      <FocusSystemUpdates />
      <MemberResources />
      <AccountBilling email={email} />
    </div>
  );
}

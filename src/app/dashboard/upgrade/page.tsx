import Link from "next/link";

import { answersFromQuizRow } from "@/lib/dashboard/answers-from-quiz-row";
import { requireDashboardLogin } from "@/lib/dashboard/require-dashboard";
import {
  hasBonusesAccess,
  hasBrainProfileAccess,
  hasMembershipAccess,
  hasRoadmapAccess,
} from "@/lib/dashboard/unlock";
import {
  isUpgradeNeed,
  resolveUpgradeNeedTarget,
  type UpgradeNeed,
} from "@/lib/dashboard/upgrade-handoff";

export const metadata = {
  title: "Upgrade · FocusRoute",
};

const COPY: Record<UpgradeNeed, { title: string; body: string; cta: string }> = {
  brain_profile: {
    title: "Your Brain Profile is locked",
    body: "Complete checkout to unlock your personalized cognitive profile, Executive Function Radar, and bonus resources.",
    cta: "Unlock Brain Profile",
  },
  roadmap_28_day: {
    title: "28-Day Protocol",
    body: "Add the 28-Day Protocol to get structured daily micro-actions calibrated to your Brain Profile.",
    cta: "Unlock 28-Day Protocol",
  },
  bonus_toolkit: {
    title: "Bonuses",
    body: "Bonus resources are included with qualifying purchases — toolkit, audio guides, and explain scripts.",
    cta: "View upgrade options",
  },
  membership: {
    title: "FocusRoute Membership",
    body: "Membership keeps your Brain OS active — with monthly resets, retakes when your context shifts, and protocol updates built around how your brain changes over time.",
    cta: "View membership options",
  },
};

const DEFAULT = {
  title: "Unlock your Brain Profile",
  body: "Complete the assessment checkout to access your personalized Brain Profile, 28-Day Protocol, and bonus library. Access syncs to your account automatically after payment.",
  cta: "Unlock Brain Profile",
};

export default async function DashboardUpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const snap = await requireDashboardLogin();
  const { need } = await searchParams;
  const needKey: UpgradeNeed = isUpgradeNeed(need) ? need : "brain_profile";
  const u = snap.entitlementSet;
  const target = resolveUpgradeNeedTarget(needKey, u);
  const hint =
    target.kind === "purchase"
      ? COPY[target.need]
      : isUpgradeNeed(need)
        ? COPY[need]
        : DEFAULT;

  /* Authenticated funnel handoff: only route into the funnel when a completed
     assessment exists to restore (the server-verified handoff reopens the right
     step with the user's real context). Without one, send the user to take the
     assessment first — explicitly, never a silent Q1 drop. CTA wording matches
     whichever destination applies. */
  const hasQuizResult = answersFromQuizRow(snap.latestQuizResult).length > 0;
  const ctaHref = !hasQuizResult
    ? "/assessment"
    : target.kind === "purchase"
      ? `/assessment?upgrade=${target.need}`
      : target.href;
  const ctaLabel = !hasQuizResult
    ? "Take the 2-minute assessment"
    : target.kind === "purchase"
      ? hint.cta
      : target.cta;
  const ctaBody = hasQuizResult
    ? hint.body
    : "Your plan is built from your assessment answers. Take the 2-minute assessment to unlock checkout — your access then syncs to this account automatically.";

  const resolvedCtaBody =
    hasQuizResult && target.kind === "dashboard"
      ? "That access is already unlocked on your dashboard. Open it there instead of starting another checkout."
      : ctaBody;

  const hasAny =
    hasBrainProfileAccess(u) ||
    hasRoadmapAccess(u) ||
    hasBonusesAccess(u) ||
    hasMembershipAccess(u);

  const status = [
    { label: "Brain Profile", ok: hasBrainProfileAccess(u) },
    { label: "28-Day Protocol", ok: hasRoadmapAccess(u) },
    { label: "Bonuses", ok: hasBonusesAccess(u) },
    { label: "Membership", ok: hasMembershipAccess(u) },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          padding: "24px 22px",
          background: "linear-gradient(135deg, var(--color-primary-tint), var(--color-cognitive-tint))",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
          {hint.title}
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65, marginBottom: 20 }}>
          {resolvedCtaBody}
        </p>
        <Link
          href={ctaHref}
          prefetch={false}
          style={{
            display: "inline-flex",
            padding: "13px 24px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-accent)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "var(--shadow-btn-accent)",
          }}
        >
          {ctaLabel}
        </Link>
      </div>

      {hasAny && (
        <div
          style={{
            borderRadius: "var(--radius-md)",
            padding: "16px 18px",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 10 }}>
            Your access
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            {status.map((row) => (
              <li key={row.label}>
                {row.label}:{" "}
                <span style={{ color: row.ok ? "var(--color-success)" : "var(--color-text-muted)", fontWeight: row.ok ? 700 : 400 }}>
                  {row.ok ? "unlocked" : "locked"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";

import { requireDashboardLogin } from "@/lib/dashboard/require-dashboard";
import {
  hasBonusesAccess,
  hasBrainProfileAccess,
  hasMembershipAccess,
  hasRoadmapAccess,
} from "@/lib/dashboard/unlock";

export const metadata = {
  title: "Upgrade · FocusRoute",
};

const COPY: Record<string, { title: string; body: string; cta: string; href: string }> = {
  brain_profile: {
    title: "Your Brain Profile is locked",
    body: "Complete checkout to unlock your personalized cognitive profile, Executive Function Radar, and bonus resources.",
    cta: "Unlock Brain Profile",
    href: "/assessment?step=paywall",
  },
  roadmap_28_day: {
    title: "28-Day Protocol",
    body: "Add the 28-Day Protocol to get structured daily micro-actions calibrated to your Brain Profile.",
    cta: "Unlock 28-Day Protocol",
    href: "/assessment?step=upsell",
  },
  bonus_toolkit: {
    title: "Bonuses",
    body: "Bonus resources are included with qualifying purchases — toolkit, audio guides, and explain scripts.",
    cta: "View upgrade options",
    href: "/assessment?step=upsell",
  },
  membership: {
    title: "FocusRoute Membership",
    body: "Membership keeps your Brain OS active — with monthly resets, retakes when your context shifts, and protocol updates built around how your brain changes over time.",
    cta: "View membership options",
    href: "/assessment?step=subscription",
  },
};

const DEFAULT = {
  title: "Unlock your Brain Profile",
  body: "Complete the assessment checkout to access your personalized Brain Profile, 28-Day Protocol, and bonus library. Access syncs to your account automatically after payment.",
  cta: "Unlock Brain Profile",
  href: "/assessment?step=paywall",
};

export default async function DashboardUpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const snap = await requireDashboardLogin();
  const { need } = await searchParams;
  const hint = (need && COPY[need]) || DEFAULT;

  const u = snap.entitlementSet;
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
          {hint.body}
        </p>
        <Link
          href={hint.href}
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
          {hint.cta}
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

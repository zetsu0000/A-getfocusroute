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

const COPY: Record<string, { title: string; body: string }> = {
  brain_profile: {
    title: "Brain Profile",
    body: "Unlock the full assessment readout and signature summary with the Brain OS profile purchase.",
  },
  roadmap_28_day: {
    title: "28-Day Protocol",
    body: "Add the roadmap product to get structured daily steps aligned to your map.",
  },
  bonus_toolkit: {
    title: "Bonuses",
    body: "Bonuses ship with qualifying bundles (toolkit, audio, or explain scripts). Upgrade from checkout when offered.",
  },
  membership: {
    title: "Membership",
    body: "Subscribe for ongoing access, retakes, and billing portal tools.",
  },
};

export default async function DashboardUpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const snap = await requireDashboardLogin();
  const { need } = await searchParams;
  const hint = (need && COPY[need]) || {
    title: "Choose your next unlock",
    body: "Browse the funnel checkout to add Brain Profile, roadmap, bonuses, or membership — access syncs to this email automatically after payment.",
  };

  const u = snap.entitlementSet;
  const status = [
    { label: "Brain Profile", ok: hasBrainProfileAccess(u) },
    { label: "28-Day Protocol", ok: hasRoadmapAccess(u) },
    { label: "Bonuses", ok: hasBonusesAccess(u) },
    { label: "Membership", ok: hasMembershipAccess(u) },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)" }}>{hint.title}</h2>
      <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>{hint.body}</p>

      <div
        style={{
          borderRadius: 16,
          padding: "16px 18px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 800, color: "var(--color-text-muted)", marginBottom: 10 }}>
          Current server entitlements
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.7 }}>
          {status.map((row) => (
            <li key={row.label}>
              {row.label}: {row.ok ? "unlocked" : "locked"}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/"
        prefetch={false}
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "12px 22px",
          borderRadius: 12,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Go to checkout funnel
      </Link>
    </div>
  );
}

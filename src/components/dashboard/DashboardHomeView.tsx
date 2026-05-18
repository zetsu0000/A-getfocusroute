import Link from "next/link";

import { DashboardMembershipSummary } from "@/components/dashboard/DashboardMembershipSummary";
import { DashboardRetakeSection } from "@/components/dashboard/DashboardRetakeSection";
import type { LoggedInDashboardSnapshot } from "@/lib/dashboard/load-dashboard-context";
import {
  hasBonusesAccess,
  hasBrainProfileAccess,
  hasMembershipAccess,
  hasRetakeQuizAccess,
  hasRoadmapAccess,
} from "@/lib/dashboard/unlock";

function FeatureCard({
  title,
  subtitle,
  href,
  locked,
  need,
}: {
  title: string;
  subtitle: string;
  href: string;
  locked: boolean;
  need: string;
}) {
  const dest = locked ? `/dashboard/upgrade?need=${encodeURIComponent(need)}` : href;
  return (
    <Link
      href={dest}
      prefetch={false}
      style={{
        display: "block",
        borderRadius: "var(--radius-lg)",
        padding: "18px 18px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
        opacity: locked ? 0.72 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>{title}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5 }}>{subtitle}</p>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "4px 8px",
            borderRadius: 8,
            background: locked ? "var(--color-bg-card-2)" : "var(--color-success-tint)",
            color: locked ? "var(--color-text-muted)" : "var(--color-success)",
            flexShrink: 0,
          }}
        >
          {locked ? "Locked" : "Open"}
        </span>
      </div>
    </Link>
  );
}

export function DashboardHomeView({ snap }: { snap: LoggedInDashboardSnapshot }) {
  const u = snap.entitlementSet;
  const profileOpen = hasBrainProfileAccess(u);
  const roadmapOpen = hasRoadmapAccess(u);
  const bonusesOpen = hasBonusesAccess(u);
  const membershipOpen = hasMembershipAccess(u);
  const retake = hasRetakeQuizAccess(u);

  const displayName = snap.profile?.full_name?.trim() || snap.user.email.split("@")[0] || "Member";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 520, margin: "0 auto" }}>
      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          Your FocusRoute access
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <FeatureCard
            title="Brain Profile"
            subtitle="Full assessment readout, symptom framing, and signature summary."
            href="/dashboard/profile"
            locked={!profileOpen}
            need="brain_profile"
          />
          <FeatureCard
            title="28-Day Protocol"
            subtitle="Daily structure and micro-steps aligned to your Brain OS map."
            href="/dashboard/roadmap"
            locked={!roadmapOpen}
            need="roadmap_28_day"
          />
          <FeatureCard
            title="Bonuses"
            subtitle="Toolkit, audio guides, and explain-this scripts when included in your purchase."
            href="/dashboard/bonuses"
            locked={!bonusesOpen}
            need="bonus_toolkit"
          />
          <FeatureCard
            title="Membership"
            subtitle="Subscription status, renewals, and member-only retakes."
            href="/dashboard/membership"
            locked={!membershipOpen}
            need="membership"
          />
        </div>
      </section>

      {retake && (
        <section>
          <DashboardRetakeSection email={snap.user.email} displayName={displayName} />
        </section>
      )}

      <section>
        <DashboardMembershipSummary subscriptions={snap.subscriptions} />
      </section>

      <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5, textAlign: "center" }}>
        Your access is managed securely on your account.
      </p>
    </div>
  );
}

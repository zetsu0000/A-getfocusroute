import Link from "next/link";

import { DashboardMembershipSummary } from "@/components/dashboard/DashboardMembershipSummary";
import { AccessBadge, PremiumCard, SectionEyebrow } from "@/components/dashboard/DashboardPrimitives";
import { DashboardRetakeSection } from "@/components/dashboard/DashboardRetakeSection";
import { DisplayNameForm } from "@/components/dashboard/DisplayNameForm";
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
  cta,
  href,
  locked,
  need,
  featured = false,
}: {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  locked: boolean;
  need: string;
  featured?: boolean;
}) {
  const dest = locked
    ? (need === "roadmap_28_day" ? "/roadmap" : `/dashboard/upgrade?need=${encodeURIComponent(need)}`)
    : href;

  return (
    <Link
      href={dest}
      prefetch={false}
      style={{
        display: "block",
        borderRadius: 18,
        padding: featured ? "18px 18px" : "15px 15px",
        background: "var(--color-bg-card)",
        border: featured ? "1px solid var(--color-border-2)" : "1px solid var(--color-border)",
        borderTop: featured ? "2px solid var(--color-cognitive)" : "1px solid var(--color-border)",
        boxShadow: featured ? "var(--shadow-card-strong)" : "var(--shadow-card)",
        textDecoration: "none",
        opacity: locked ? 0.92 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>{title}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5 }}>{subtitle}</p>
        </div>
        <AccessBadge unlocked={!locked} />
      </div>
      <p
        style={{
          marginTop: 10,
          fontSize: 12,
          fontWeight: 800,
          color: locked ? "var(--color-accent)" : "var(--color-signal)",
        }}
      >
        {cta}
      </p>
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

  const storedDisplayName = snap.profile?.full_name?.trim() || "";
  const displayName = storedDisplayName || snap.user.email.split("@")[0] || "Member";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 520, margin: "0 auto" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionEyebrow>Your FocusRoute system</SectionEyebrow>
        <PremiumCard featured>
          <p style={{ fontSize: 20, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.22, marginBottom: 6 }}>
            Your FocusRoute system
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.65, marginBottom: 14 }}>
            Your profile, bonuses, and next-step protocols in one place.
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)", paddingTop: 12, marginBottom: 14 }}>
            Signed in as {displayName}
          </p>
          <DisplayNameForm initialName={storedDisplayName} />
        </PremiumCard>
      </section>

      <section>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Your access
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <FeatureCard
            title="Brain Profile"
            subtitle={profileOpen ? "Your personalized profile is ready." : "Unlock your personalized profile and explanation script."}
            cta={profileOpen ? "Open Brain Profile" : "Unlock Brain Profile"}
            href="/dashboard/profile"
            locked={!profileOpen}
            need="brain_profile"
            featured
          />
          <FeatureCard
            title="28-Day Protocol"
            subtitle={roadmapOpen ? "Your day-by-day protocol is available." : "Your premium next step after the Brain Profile."}
            cta={roadmapOpen ? "Open 28-Day Protocol" : "Explore the 28-Day Protocol"}
            href="/dashboard/roadmap"
            locked={!roadmapOpen}
            need="roadmap_28_day"
          />
          <FeatureCard
            title="Bonuses"
            subtitle={bonusesOpen ? "Your bonus library is ready to use." : "Included with the 28-Day Protocol."}
            cta={bonusesOpen ? "View Bonuses" : "Explore the 28-Day Protocol"}
            href="/dashboard/bonuses"
            locked={!bonusesOpen}
            need="bonus_toolkit"
          />
          <FeatureCard
            title={membershipOpen ? "Your membership is active" : "Explore membership"}
            subtitle="Subscription status, renewals, and member-only retakes."
            cta="Explore Membership"
            href="/dashboard/membership"
            locked={!membershipOpen}
            need="membership"
          />
          <Link
            href="/dashboard/membership"
            prefetch={false}
            style={{
              display: "block",
              borderRadius: 18,
              padding: "15px 15px",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              textDecoration: "none",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>Billing</p>
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5, marginBottom: 8 }}>
              Purchases, subscription status, and account billing support.
            </p>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--color-signal)" }}>Open Billing</p>
          </Link>
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

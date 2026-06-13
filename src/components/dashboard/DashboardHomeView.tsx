import type { ComponentType } from "react";
import { ArrowRight, BookOpenCheck, Compass, FileText, Library, ReceiptText } from "lucide-react";

import { FirstActionLink } from "@/components/dashboard/FirstActionLink";
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
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  locked: boolean;
  need: string;
  featured?: boolean;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}) {
  const dest = locked
    ? (need === "roadmap_28_day" ? "/roadmap" : `/dashboard/upgrade?need=${encodeURIComponent(need)}`)
    : href;

  return (
    <FirstActionLink
      href={dest}
      action={`${locked ? "unlock" : "open"}:${need}`}
      style={{
        display: "block",
        borderRadius: 18,
        padding: featured ? "18px 18px" : "15px 15px",
        background: featured
          ? "linear-gradient(180deg,var(--color-bg-card),var(--color-bg-card-2))"
          : "var(--color-bg-card)",
        border: featured ? "1px solid var(--color-border-2)" : "1px solid var(--color-border)",
        boxShadow: featured ? "var(--shadow-card-strong)" : "var(--shadow-card)",
        textDecoration: "none",
        opacity: locked ? 0.92 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: locked ? "var(--color-bg-card-2)" : "var(--color-accent-tint)", border: "1px solid var(--color-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={17} color={locked ? "var(--color-text-muted)" : "var(--color-accent)"} strokeWidth={2.3} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5 }}>{subtitle}</p>
          </div>
        </div>
        <AccessBadge unlocked={!locked} />
      </div>
      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          fontWeight: 800,
          color: locked ? "var(--color-accent)" : "var(--color-signal)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {cta} <ArrowRight size={13} strokeWidth={2.4} />
      </p>
    </FirstActionLink>
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
  const greetingName = storedDisplayName;
  const retakeName = storedDisplayName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 520, margin: "0 auto" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionEyebrow>Your FocusRoute system</SectionEyebrow>
        <PremiumCard featured>
          <p style={{ fontSize: 20, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.22, marginBottom: 6 }}>
            {greetingName ? `Welcome back, ${greetingName}` : "Your FocusRoute system"}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.65, marginBottom: 14 }}>
            Your profile, bonuses, and next-step protocols in one place.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderTop: "1px solid var(--color-border)",
              paddingTop: 12,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {snap.user.email}
            </p>
            <DisplayNameForm initialName={storedDisplayName} />
          </div>
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
            icon={FileText}
          />
          <FeatureCard
            title="28-Day Protocol"
            subtitle={roadmapOpen ? "Your day-by-day protocol is available." : "Your premium next step after the Brain Profile."}
            cta={roadmapOpen ? "Open 28-Day Protocol" : "Explore the 28-Day Protocol"}
            href="/dashboard/roadmap"
            locked={!roadmapOpen}
            need="roadmap_28_day"
            icon={Compass}
          />
          <FeatureCard
            title="Bonuses"
            subtitle={bonusesOpen ? "Your bonus library is ready to use." : "Included with the 28-Day Protocol."}
            cta={bonusesOpen ? "View Bonuses" : "Explore the 28-Day Protocol"}
            href="/dashboard/bonuses"
            locked={!bonusesOpen}
            need="bonus_toolkit"
            icon={Library}
          />
          <FeatureCard
            title={membershipOpen ? "Your membership is active" : "Explore membership"}
            subtitle="Subscription status, renewals, and member-only retakes."
            cta="Explore Membership"
            href="/dashboard/membership"
            locked={!membershipOpen}
            need="membership"
            icon={BookOpenCheck}
          />
          <FirstActionLink
            href="/dashboard/membership"
            action="open:billing"
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
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--color-bg-card-2)", border: "1px solid var(--color-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ReceiptText size={17} color="var(--color-text-muted)" strokeWidth={2.3} />
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>Billing</p>
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5, marginBottom: 8 }}>
              Purchases, subscription status, and account billing support.
            </p>
                <p style={{ fontSize: 12, fontWeight: 800, color: "var(--color-signal)", display: "inline-flex", alignItems: "center", gap: 6 }}>Open Billing <ArrowRight size={13} strokeWidth={2.4} /></p>
              </div>
            </div>
          </FirstActionLink>
        </div>
      </section>

      {retake && (
        <section>
          <DashboardRetakeSection email={snap.user.email} displayName={retakeName} />
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

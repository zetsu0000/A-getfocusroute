import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { LoggedInDashboardSnapshot } from "@/lib/dashboard/load-dashboard-context";
import {
  hasBonusesAccess,
  hasBrainProfileAccess,
  hasMembershipAccess,
  hasRoadmapAccess,
} from "@/lib/dashboard/unlock";

const navLink: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-body)",
  textDecoration: "none",
  padding: "6px 0",
  borderBottom: "2px solid transparent",
};

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      style={{
        ...navLink,
        fontWeight: active ? 800 : 500,
        color: active ? "var(--color-primary)" : "var(--color-text-body)",
        borderBottomColor: active ? "var(--color-primary)" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

export function DashboardNav({
  snap,
  pathname,
}: {
  snap: LoggedInDashboardSnapshot;
  pathname: string;
}) {
  const firstName = snap.profile?.full_name?.trim() || snap.user.email.split("@")[0] || "";
  const u = snap.entitlementSet;

  return (
    <header style={{ paddingTop: 24, marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <Link
          href="/"
          prefetch={false}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          Home
        </Link>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Dashboard
        </span>
      </div>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "var(--color-text)",
          lineHeight: 1.25,
          marginBottom: 4,
        }}
      >
        {firstName ? (<>Welcome back, <span style={{ color: "var(--color-primary)" }}>{firstName}</span></>) : "Welcome back"}
      </h1>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{snap.user.email}</p>

      <nav
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: "0 20px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 4,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <NavLink href="/dashboard" label="Overview" active={pathname === "/dashboard"} />
        <NavLink
          href={hasBrainProfileAccess(u) ? "/dashboard/profile" : "/dashboard/upgrade?need=brain_profile"}
          label="Brain Profile"
          active={pathname.startsWith("/dashboard/profile")}
        />
        <NavLink
          href={hasRoadmapAccess(u) ? "/dashboard/roadmap" : "/dashboard/upgrade?need=roadmap_28_day"}
          label="28-Day Protocol"
          active={pathname.startsWith("/dashboard/roadmap")}
        />
        <NavLink
          href={hasBonusesAccess(u) ? "/dashboard/bonuses" : "/dashboard/upgrade?need=bonus_toolkit"}
          label="Bonuses"
          active={pathname.startsWith("/dashboard/bonuses")}
        />
        <NavLink
          href={hasMembershipAccess(u) ? "/dashboard/membership" : "/dashboard/upgrade?need=membership"}
          label="Membership"
          active={pathname.startsWith("/dashboard/membership")}
        />
        <NavLink href="/dashboard/upgrade" label="Upgrade" active={pathname.startsWith("/dashboard/upgrade")} />
      </nav>
    </header>
  );
}

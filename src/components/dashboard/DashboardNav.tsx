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
  fontSize: 12,
  color: "var(--color-text)",
  textDecoration: "none",
  padding: "8px 12px",
  border: "1px solid transparent",
  borderRadius: "var(--radius-pill)",
  whiteSpace: "nowrap",
  flexShrink: 0,
  scrollSnapAlign: "start",
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
        fontWeight: active ? 800 : 600,
        color: active ? "var(--color-text)" : "var(--color-text-body)",
        background: active ? "var(--color-bg-card)" : "transparent",
        borderColor: active ? "var(--color-border-2)" : "transparent",
        boxShadow: active ? "inset 0 -2px 0 var(--color-accent), 0 1px 8px rgba(20,17,31,0.05)" : "none",
        transition: "background 150ms ease, color 150ms ease, box-shadow 150ms ease",
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
  const u = snap.entitlementSet;
  const displayName = snap.profile?.full_name?.trim() || "";

  return (
    <header style={{ paddingTop: 20, marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
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
            color: "var(--color-signal)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Dashboard
        </span>
      </div>

      <h1
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "var(--color-text)",
          lineHeight: 1.25,
          marginBottom: 5,
        }}
      >
        {displayName ? <>Welcome back, {displayName}</> : "Welcome back"}
      </h1>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{snap.user.email}</p>

      <nav
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 8,
          borderBottom: "1px solid var(--color-border)",
          padding: "0 16px 10px 12px",
          margin: "0 -2px",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          scrollPaddingInline: 12,
          overscrollBehaviorX: "contain",
          scrollSnapType: "x proximity",
          maskImage:
            "linear-gradient(to right, black 0, black calc(100% - 22px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0, black calc(100% - 22px), transparent 100%)",
        }}
      >
        <NavLink href="/dashboard" label="Overview" active={pathname === "/dashboard"} />
        <NavLink
          href={hasBrainProfileAccess(u) ? "/dashboard/profile" : "/dashboard/upgrade?need=brain_profile"}
          label="Brain Profile"
          active={pathname.startsWith("/dashboard/profile")}
        />
        <NavLink
          href={hasRoadmapAccess(u) ? "/dashboard/roadmap" : "/roadmap"}
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
      </nav>
    </header>
  );
}

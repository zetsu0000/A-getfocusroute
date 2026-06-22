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
  color: "var(--v2-ink)",
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
        color: active ? "var(--v2-signal-2)" : "var(--v2-ink-dim)",
        background: active ? "rgba(124,138,255,0.12)" : "transparent",
        borderColor: active ? "rgba(155,232,255,0.35)" : "transparent",
        boxShadow: active ? "0 0 18px rgba(124,138,255,0.18)" : "none",
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
            color: "var(--v2-ink-faint)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          Home
        </Link>
        <span
          className="v2-hud"
          style={{ color: "var(--v2-signal-2)" }}
        >
          Your observatory
        </span>
      </div>

      <h1
        className="v2-display"
        style={{
          fontSize: "clamp(22px, 4vw, 27px)",
          lineHeight: 1.2,
          marginBottom: 5,
        }}
      >
        {displayName ? <>Welcome back, {displayName}</> : "Welcome back"}
      </h1>
      <p style={{ fontSize: 13, color: "var(--v2-ink-faint)", marginBottom: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{snap.user.email}</p>

      <nav
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 8,
          borderBottom: "1px solid var(--v2-line)",
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
          label="Focus Pattern"
          active={pathname.startsWith("/dashboard/profile")}
        />
        <NavLink
          href={hasRoadmapAccess(u) ? "/dashboard/roadmap" : "/roadmap"}
          label="28-Day FocusRoute"
          active={pathname.startsWith("/dashboard/roadmap")}
        />
        <NavLink
          href={hasBonusesAccess(u) ? "/dashboard/bonuses" : "/dashboard/upgrade?need=bonus_toolkit"}
          label="Focus Tools"
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

"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

const SESSION_GUARD = "focusroute_dash_first_action";

/**
 * Link wrapper for dashboard primary actions: fires
 * dashboard_first_action_clicked exactly once per session, tagged with the
 * action the user chose first. Server components stay server components —
 * only the link itself is a client island.
 */
export function FirstActionLink({
  href,
  action,
  prefetch = false,
  style,
  children,
}: {
  href: string;
  action: string;
  prefetch?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const handleClick = () => {
    try {
      if (window.sessionStorage.getItem(SESSION_GUARD)) return;
      window.sessionStorage.setItem(SESSION_GUARD, "1");
    } catch {
      // Restricted storage: still fire once per page life via the catch-less path below.
    }
    trackEvent(FIRST_PARTY_EVENTS.dashboardFirstActionClicked, {
      meta: false,
      metadata: { action, href },
    });
  };

  return (
    <Link href={href} prefetch={prefetch} style={style} onClick={handleClick}>
      {children}
    </Link>
  );
}

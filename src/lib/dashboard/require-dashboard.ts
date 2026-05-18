import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { EntitlementKey } from "@/lib/access/entitlements";

import { getDashboardSnapshot, isDashboardLoggedIn } from "./load-dashboard-context";

export async function requireDashboardLogin() {
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
  const snap = await getDashboardSnapshot();
  if (!isDashboardLoggedIn(snap)) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }
  return snap;
}

/**
 * Server-only route guard. Never rely on the client for this check.
 */
export async function requireDashboardEntitlement(
  check: (kinds: Set<EntitlementKey>) => boolean,
  /** Query param for /dashboard/upgrade messaging */
  need: string,
) {
  const snap = await requireDashboardLogin();
  if (!check(snap.entitlementSet)) {
    redirect(`/dashboard/upgrade?need=${encodeURIComponent(need)}`);
  }
  return snap;
}

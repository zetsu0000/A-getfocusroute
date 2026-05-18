import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  DASHBOARD_ENTITLEMENTS,
  userHasAnyEntitlement,
  userHasEntitlement,
  type EntitlementKey,
} from "./entitlements";

/**
 * Require a signed-in user with a specific active entitlement. Server-only.
 */
export async function requireEntitlement(kind: EntitlementKey): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const ok = await userHasEntitlement(user.id, kind);
  if (!ok) {
    redirect("/?access=denied");
  }
}

/**
 * Require a signed-in user with at least one of the given entitlements.
 */
export async function requireAnyEntitlement(
  kinds: readonly EntitlementKey[],
  loginNext = "/dashboard",
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }

  const ok = await userHasAnyEntitlement(user.id, kinds);
  if (!ok) {
    redirect("/?access=denied");
  }
}

/**
 * Dashboard: must be logged in and have a paid product represented in entitlements (not localStorage).
 */
export async function requirePaidDashboardAccess(): Promise<void> {
  await requireAnyEntitlement(DASHBOARD_ENTITLEMENTS, "/dashboard");
}

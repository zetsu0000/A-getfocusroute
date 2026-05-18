import "server-only";

import { appendFileSync } from "node:fs";
import { join } from "node:path";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";

import {
  claimEmailProductGrantsForUser,
  getActiveEntitlementKindsForUser,
  type EntitlementKey,
} from "@/lib/access/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DashboardUser = { id: string; email: string };

export type DashboardProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export type DashboardPurchaseRow = {
  id: string;
  product_key: string;
  amount: number | null;
  currency: string;
  status: string;
  created_at: string;
};

export type DashboardSubscriptionRow = {
  id: string;
  status: string;
  stripe_subscription_id: string | null;
  price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type DashboardQuizResultRow = Record<string, unknown>;

export type DashboardSnapshot =
  | { user: null }
  | {
      user: DashboardUser;
      profile: DashboardProfileRow | null;
      entitlementSet: Set<EntitlementKey>;
      entitlementKinds: EntitlementKey[];
      latestQuizResult: DashboardQuizResultRow | null;
      purchases: DashboardPurchaseRow[];
      subscriptions: DashboardSubscriptionRow[];
    };

export type LoggedInDashboardSnapshot = Exclude<DashboardSnapshot, { user: null }>;

export function isDashboardLoggedIn(
  snap: DashboardSnapshot,
): snap is Exclude<DashboardSnapshot, { user: null }> {
  return snap.user !== null;
}

const AGENT_DEBUG_LOG = join(process.cwd(), "debug-8b4af7.log");

function agentServerLog(payload: Record<string, unknown>) {
  // #region agent log
  try {
    appendFileSync(
      AGENT_DEBUG_LOG,
      JSON.stringify({
        sessionId: "8b4af7",
        timestamp: Date.now(),
        ...payload,
      }) + "\n",
    );
  } catch {
    /* ignore */
  }
  // #endregion
}

async function ensureProfileRow(user: User) {
  const supabase = await createClient();
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) {
    console.error("[dashboard] profile select", selErr);
    return;
  }
  if (existing) return;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // #region agent log
    agentServerLog({
      hypothesisId: "H7",
      location: "load-dashboard-context.ts:ensureProfileRow",
      message: "Skip profile upsert: SUPABASE_SERVICE_ROLE_KEY unset",
      runId: "post-fix",
    });
    // #endregion
    console.warn(
      "[dashboard] SUPABASE_SERVICE_ROLE_KEY missing; skip profile upsert (dev-friendly)",
    );
    return;
  }

  const admin = createAdminClient();
  const fullName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";

  const { error: upErr } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
    },
    { onConflict: "id" },
  );
  if (upErr) console.error("[dashboard] profile upsert", upErr);
}

/**
 * Per-request cached dashboard payload: claims email grants, ensures profile,
 * loads quiz results, purchases, subscriptions, and active entitlements (all server-side).
 */
export const getDashboardSnapshot = cache(async (): Promise<DashboardSnapshot> => {
  const pubUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const pubAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!pubUrl || !pubAnon) {
    // #region agent log
    agentServerLog({
      hypothesisId: "H6",
      location: "load-dashboard-context.ts:getDashboardSnapshot",
      message: "Return anonymous snapshot: public Supabase env missing",
      runId: "post-fix",
    });
    // #endregion
    console.warn(
      "[dashboard] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing; treating as logged out",
    );
    return { user: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { user: null };
  }

  try {
    await claimEmailProductGrantsForUser(user.id, user.email);
  } catch (e) {
    console.error("[dashboard] claimEmailProductGrantsForUser", e);
  }

  await ensureProfileRow(user);

  const entitlementSet = await getActiveEntitlementKindsForUser(user.id);
  const entitlementKinds = [...entitlementSet];

  const [
    { data: profile, error: profileErr },
    { data: quizRows, error: quizErr },
    { data: purchases, error: purchasesErr },
    { data: subscriptions, error: subscriptionsErr },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("quiz_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("purchases")
      .select("id, product_key, amount, currency, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("subscriptions")
      .select(
        "id, status, stripe_subscription_id, price_id, current_period_start, current_period_end, cancel_at_period_end, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (profileErr) console.error("[dashboard] profiles", profileErr);
  if (quizErr) console.error("[dashboard] quiz_results", quizErr);
  if (purchasesErr) console.error("[dashboard] purchases", purchasesErr);
  if (subscriptionsErr) console.error("[dashboard] subscriptions", subscriptionsErr);

  const latestQuizResult =
    quizRows?.[0] != null ? (quizRows[0] as DashboardQuizResultRow) : null;

  return {
    user: { id: user.id, email: user.email },
    profile: (profile as DashboardProfileRow | null) ?? null,
    entitlementSet,
    entitlementKinds,
    latestQuizResult,
    purchases: (purchases as DashboardPurchaseRow[] | null) ?? [],
    subscriptions: (subscriptions as DashboardSubscriptionRow[] | null) ?? [],
  };
});

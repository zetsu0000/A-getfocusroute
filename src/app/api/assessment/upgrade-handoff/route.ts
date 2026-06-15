import { answersFromQuizRow } from "@/lib/dashboard/answers-from-quiz-row";
import { getActiveEntitlementKindsForUser } from "@/lib/access/entitlements";
import {
  decideUpgradeHandoff,
  isUpgradeNeed,
  resolveUpgradeNeedTarget,
  type UpgradeHandoffDecision,
} from "@/lib/dashboard/upgrade-handoff";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated dashboard → funnel handoff verification.
 *
 * Restores an authenticated user's real funnel context (their saved assessment)
 * so a /dashboard/upgrade "Unlock…" CTA can reopen the requested step instead of
 * silently dropping them on Q1. This is a server-verified channel: it requires a
 * valid session AND a completed assessment, and it never relaxes the public
 * `gateFunnelEntry`. It performs no payment work — no Stripe call, no
 * PaymentIntent — opening a step is navigation only; payment is still required
 * and verified independently.
 */
function handoffResponse(decision: UpgradeHandoffDecision): Response {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store");
  return Response.json(decision, { headers });
}

export async function GET(request: Request) {
  const need = new URL(request.url).searchParams.get("need");

  // Cheap rejections first: an unknown need never touches auth or the database.
  if (!isUpgradeNeed(need)) {
    return handoffResponse({ authorized: false, reason: "invalid_request" });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Login alone is not enough, but a query parameter without a session is
    // certainly not: deny before reading any assessment data.
    if (!user?.email) {
      return handoffResponse({ authorized: false, reason: "unauthenticated" });
    }

    const entitlementSet = await getActiveEntitlementKindsForUser(
      user.id,
      user.email,
    );
    const target = resolveUpgradeNeedTarget(need, entitlementSet);
    if (target.kind === "dashboard") {
      return handoffResponse({
        authorized: false,
        reason: "already_unlocked",
        redirectTo: target.href,
        cta: target.cta,
      });
    }

    const { data: rows } = await supabase
      .from("quiz_results")
      .select("id, email, name, answers, payload, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const quizRow = (rows?.[0] as Record<string, unknown> | undefined) ?? null;
    const quizAnswers = answersFromQuizRow(quizRow);
    if (!quizRow || quizAnswers.length === 0) {
      return handoffResponse({ authorized: false, reason: "no_assessment" });
    }

    const decision = decideUpgradeHandoff(need, {
      user: { id: user.id, email: user.email },
      quizRow,
      quizAnswers,
      entitlementSet,
    });
    return handoffResponse(decision);
  } catch {
    return handoffResponse({ authorized: false, reason: "error" });
  }
}

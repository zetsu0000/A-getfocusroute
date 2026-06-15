import type { FunnelStep } from "@/types/quiz";
import type { QuizAnswer } from "@/types/quiz";
import type { EntitlementKey } from "@/lib/access/entitlements";
import {
  hasBrainProfileAccess,
  hasMembershipAccess,
  hasRoadmapAccess,
} from "@/lib/dashboard/unlock";

/**
 * Authenticated dashboard → funnel handoff (production audit, PR 1 follow-up).
 *
 * PR 1 made the public `?step=` gate refuse to advance the funnel from a query
 * parameter alone. That correctly blocked anonymous `/assessment?step=paywall`,
 * but it also broke the `/dashboard/upgrade` "Unlock…" CTAs: an authenticated
 * user opening one in a fresh tab has no sessionStorage funnel state, so the
 * public gate denied the step and dropped them on Q1.
 *
 * The fix is a *separate, server-verified* channel — it never relaxes
 * `gateFunnelEntry`. The dashboard links to `/assessment?upgrade=<need>`; the
 * client asks an authenticated endpoint to restore the user's real funnel
 * context (their saved assessment) and only then opens the requested step.
 *
 * What counts as proof here is deliberately strict, and is checked server-side:
 *  - a valid Supabase session (login), AND
 *  - existing entitlement when the product is already owned, OR
 *  - a saved quiz result with real answers before opening a purchase step.
 *
 * Neither login alone, a query parameter alone, nor a manipulated request is
 * sufficient. Opening a step is *navigation only*: it never grants an
 * entitlement — payment is still required and verified independently.
 */

/** The dashboard upgrade "needs" (mirrors the /dashboard/upgrade copy keys). */
export const UPGRADE_NEEDS = [
  "brain_profile",
  "roadmap_28_day",
  "bonus_toolkit",
  "membership",
] as const;

export type UpgradeNeed = (typeof UPGRADE_NEEDS)[number];

export function isUpgradeNeed(value: unknown): value is UpgradeNeed {
  return (
    typeof value === "string" &&
    (UPGRADE_NEEDS as readonly string[]).includes(value)
  );
}

/**
 * Maps a dashboard upgrade need to the funnel step that sells it. These match
 * the steps the /dashboard/upgrade page already linked to, so CTA wording keeps
 * matching its destination.
 */
export function stepForUpgradeNeed(need: UpgradeNeed): FunnelStep {
  switch (need) {
    case "brain_profile":
      return "paywall";
    case "roadmap_28_day":
    case "bonus_toolkit":
      return "upsell";
    case "membership":
      return "subscription";
  }
}

export type UpgradeNeedTarget =
  | {
      kind: "purchase";
      /** The actual currently purchasable need, which may be earlier than requested. */
      need: UpgradeNeed;
      step: FunnelStep;
    }
  | {
      kind: "dashboard";
      href: string;
      cta: string;
    };

const OWNED_DESTINATIONS: Record<
  UpgradeNeed,
  { href: string; cta: string }
> = {
  brain_profile: { href: "/dashboard/profile", cta: "Open Brain Profile" },
  roadmap_28_day: { href: "/dashboard/roadmap", cta: "Open 28-Day Protocol" },
  bonus_toolkit: { href: "/dashboard/bonuses", cta: "View Bonuses" },
  membership: { href: "/dashboard/membership", cta: "Open Membership" },
};

function purchaseTarget(need: UpgradeNeed): UpgradeNeedTarget {
  return { kind: "purchase", need, step: stepForUpgradeNeed(need) };
}

function ownedTarget(need: UpgradeNeed): UpgradeNeedTarget {
  return { kind: "dashboard", ...OWNED_DESTINATIONS[need] };
}

/**
 * Resolves a dashboard "need" to the offer the user is actually allowed to buy
 * now. This follows the existing entitlement sequence: Brain Profile first,
 * Roadmap after Brain Profile, Membership after Roadmap. Bonus Toolkit is
 * included with Roadmap and is not a standalone product.
 */
export function resolveUpgradeNeedTarget(
  need: UpgradeNeed,
  entitlementSet: Set<EntitlementKey>,
): UpgradeNeedTarget {
  const hasBrainProfile = hasBrainProfileAccess(entitlementSet);
  const hasRoadmap = hasRoadmapAccess(entitlementSet);
  const hasMembership = hasMembershipAccess(entitlementSet);
  const hasBonusToolkit = entitlementSet.has("bonus_toolkit");

  switch (need) {
    case "brain_profile":
      return hasBrainProfile
        ? ownedTarget("brain_profile")
        : purchaseTarget("brain_profile");

    case "roadmap_28_day":
      if (hasRoadmap) return ownedTarget("roadmap_28_day");
      if (!hasBrainProfile) return purchaseTarget("brain_profile");
      return purchaseTarget("roadmap_28_day");

    case "membership":
      if (hasMembership) return ownedTarget("membership");
      if (!hasRoadmap) {
        return hasBrainProfile
          ? purchaseTarget("roadmap_28_day")
          : purchaseTarget("brain_profile");
      }
      return purchaseTarget("membership");

    case "bonus_toolkit":
      if (hasRoadmap || hasBonusToolkit) return ownedTarget("bonus_toolkit");
      if (!hasBrainProfile) return purchaseTarget("brain_profile");
      return purchaseTarget("roadmap_28_day");
  }
}

/** Reads the dashboard handoff need from a URL query string ("?upgrade=..."). */
export function readUpgradeNeed(search: string): UpgradeNeed | null {
  const value = new URLSearchParams(search).get("upgrade");
  return isUpgradeNeed(value) ? value : null;
}

/** Verified inputs the handoff decision is made from (assembled server-side). */
export type UpgradeHandoffContext = {
  /** The authenticated user, or null when there is no valid session. */
  user: { id: string; email: string } | null;
  /** The user's most recent saved assessment row, or null. */
  quizRow: Record<string, unknown> | null;
  /** Answers reconstructed from `quizRow` (empty when none/invalid). */
  quizAnswers: QuizAnswer[];
  /** Active entitlements loaded server-side after authentication. */
  entitlementSet: Set<EntitlementKey>;
};

export type UpgradeHandoffDenyReason =
  | "invalid_request"
  | "unauthenticated"
  | "no_assessment"
  | "already_unlocked"
  | "error";

export type UpgradeHandoffDecision =
  | {
      authorized: true;
      step: FunnelStep;
      email: string;
      name: string;
      quizResultId: string | null;
      answers: QuizAnswer[];
    }
  | {
      authorized: false;
      reason: UpgradeHandoffDenyReason;
      redirectTo?: string;
      cta?: string;
    };

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Pure handoff decision. Already-owned products route back to their dashboard
 * pages before assessment recovery is required. Purchase steps still require a
 * real session and completed assessment, then resolve to the currently valid
 * prerequisite offer.
 */
export function decideUpgradeHandoff(
  needRaw: unknown,
  ctx: UpgradeHandoffContext,
): UpgradeHandoffDecision {
  if (!isUpgradeNeed(needRaw)) {
    return { authorized: false, reason: "invalid_request" };
  }
  if (!ctx.user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const target = resolveUpgradeNeedTarget(needRaw, ctx.entitlementSet);
  if (target.kind === "dashboard") {
    return {
      authorized: false,
      reason: "already_unlocked",
      redirectTo: target.href,
      cta: target.cta,
    };
  }
  if (!ctx.quizRow || ctx.quizAnswers.length === 0) {
    return { authorized: false, reason: "no_assessment" };
  }

  const rowEmail = stringField(ctx.quizRow.email);
  const rowId = ctx.quizRow.id;
  return {
    authorized: true,
    step: target.step,
    email: rowEmail || ctx.user.email,
    name: stringField(ctx.quizRow.name),
    quizResultId: typeof rowId === "string" && rowId ? rowId : null,
    answers: ctx.quizAnswers,
  };
}

/**
 * The only steps a handoff may ever open. Restricting to these (rather than any
 * FunnelStep) is defense-in-depth: even a forged "authorized" response can never
 * push the client to `success` or another non-purchase step.
 */
const HANDOFF_TARGET_STEPS: ReadonlySet<FunnelStep> = new Set([
  "paywall",
  "upsell",
  "subscription",
]);

function isHandoffTargetStep(value: unknown): value is FunnelStep {
  return (
    typeof value === "string" && HANDOFF_TARGET_STEPS.has(value as FunnelStep)
  );
}

function parseAnswers(value: unknown): QuizAnswer[] {
  if (!Array.isArray(value)) return [];
  const out: QuizAnswer[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.questionId !== "string" || !Array.isArray(o.selectedOptions)) {
      continue;
    }
    const opts = o.selectedOptions.filter(
      (x): x is string => typeof x === "string",
    );
    out.push({ questionId: o.questionId, selectedOptions: opts });
  }
  return out;
}

function dashboardRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value === "/dashboard" || value.startsWith("/dashboard/")
    ? value
    : undefined;
}

/**
 * Validates the JSON returned by the handoff endpoint before the client acts on
 * it. Anything malformed or unauthorized is treated as a recoverable denial —
 * never as silent permission to open a step.
 */
export function parseUpgradeHandoffResponse(
  value: unknown,
): UpgradeHandoffDecision {
  if (!value || typeof value !== "object") {
    return { authorized: false, reason: "error" };
  }
  const v = value as Record<string, unknown>;
  if (v.authorized !== true) {
    const reason = v.reason;
    return {
      authorized: false,
      reason:
        reason === "invalid_request" ||
        reason === "unauthenticated" ||
        reason === "no_assessment" ||
        reason === "already_unlocked"
          ? reason
          : "error",
      redirectTo: dashboardRedirect(v.redirectTo),
      cta: typeof v.cta === "string" ? v.cta : undefined,
    };
  }
  if (!isHandoffTargetStep(v.step)) {
    return { authorized: false, reason: "error" };
  }
  return {
    authorized: true,
    step: v.step,
    email: stringField(v.email),
    name: stringField(v.name),
    quizResultId:
      typeof v.quizResultId === "string" && v.quizResultId
        ? v.quizResultId
        : null,
    answers: parseAnswers(v.answers),
  };
}

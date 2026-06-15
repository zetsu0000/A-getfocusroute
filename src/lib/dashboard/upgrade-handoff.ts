import type { FunnelStep } from "@/types/quiz";
import type { QuizAnswer } from "@/types/quiz";

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
 *  - a saved quiz result with real answers (a genuinely completed assessment).
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

/** Reads the dashboard handoff need from a URL query string ("?upgrade=…"). */
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
};

export type UpgradeHandoffDenyReason =
  | "invalid_request"
  | "unauthenticated"
  | "no_assessment"
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
  | { authorized: false; reason: UpgradeHandoffDenyReason };

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Pure handoff decision. A step is authorized only when the request is a known
 * need AND there is a real session AND a completed assessment (answers present).
 * Restores the user's saved context so the reopened step is personalized.
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
  if (!ctx.quizRow || ctx.quizAnswers.length === 0) {
    return { authorized: false, reason: "no_assessment" };
  }

  const rowEmail = stringField(ctx.quizRow.email);
  const rowId = ctx.quizRow.id;
  return {
    authorized: true,
    step: stepForUpgradeNeed(needRaw),
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
        reason === "no_assessment"
          ? reason
          : "error",
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

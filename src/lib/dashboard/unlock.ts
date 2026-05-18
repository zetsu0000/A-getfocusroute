import type { EntitlementKey } from "@/lib/access/entitlements";

export function hasBrainProfileAccess(kinds: Set<EntitlementKey>): boolean {
  return kinds.has("brain_profile");
}

export function hasRoadmapAccess(kinds: Set<EntitlementKey>): boolean {
  return kinds.has("roadmap_28_day");
}

export function hasBonusesAccess(kinds: Set<EntitlementKey>): boolean {
  return (
    kinds.has("bonus_toolkit") ||
    kinds.has("bonus_audio") ||
    kinds.has("bonus_explain_script")
  );
}

export function hasMembershipAccess(kinds: Set<EntitlementKey>): boolean {
  return kinds.has("membership");
}

export function hasRetakeQuizAccess(kinds: Set<EntitlementKey>): boolean {
  return kinds.has("retake_quiz");
}

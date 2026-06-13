import type { FunnelStep } from "@/types/quiz";

/**
 * Decides whether the one-time `assessment_started` analytics signal should
 * fire for the current assessment render.
 *
 * The redundant assessment intro screen was removed, so a fresh entry now
 * lands directly on the first quiz question and "starting" is no longer a
 * manual button click — it is simply the first paint of Q1. This predicate
 * centralizes that rule so it stays unit-testable and cannot drift into
 * double-firing:
 *
 *  - `gateReady` — the post-purchase entry gate must have resolved first, so a
 *    Stripe redirect return showing the verifying/loading screen is never
 *    counted as a quiz start;
 *  - `step === "quiz"` at index 0 — we are genuinely showing Q1, not a resumed
 *    later question or a post-purchase screen;
 *  - `retakeMode` — a retake re-enters at Q1 but is not a fresh assessment
 *    start;
 *  - `alreadyTracked` — a render-stable ref in the component guarantees a
 *    single fire across re-renders and React Strict Mode's double-invoke.
 */
export function shouldTrackAssessmentStart(input: {
  gateReady: boolean;
  step: FunnelStep;
  currentQuestionIndex: number;
  retakeMode: boolean;
  alreadyTracked: boolean;
}): boolean {
  if (input.alreadyTracked) return false;
  if (!input.gateReady) return false;
  if (input.retakeMode) return false;
  return input.step === "quiz" && input.currentQuestionIndex === 0;
}

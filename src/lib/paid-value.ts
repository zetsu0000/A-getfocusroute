import { firstStepTeaserFor } from "@/lib/first-step-teaser";

/**
 * Single source of truth for the *names* of the concrete paid outputs, shared
 * by the result locked preview (ChartScreen) and the paywall offer
 * (paywallContent). Defined once so the two surfaces name the same real
 * deliverables and can never drift apart, and so a section is never renamed in
 * one place but not the other.
 *
 * Every label below maps to a section actually rendered in BrainProfileView for
 * the `brain_profile` entitlement bundle (see PRODUCT_TO_ENTITLEMENTS):
 *   - radar              → "Executive Function Radar™" (six radarDimensions)
 *   - cognitiveSignature → "Cognitive Signature" (profileExplanation)
 *   - conditions         → "Best Focus Conditions" (focusConditions)
 *   - taskInitiation     → "Task Initiation Style" (initiationStyle)
 *   - recovery           → "Recovery Style" (distractionRecovery)
 *   - explainScript      → "Explain-It-To-Someone Script™" — granted with the
 *                          Brain Profile via the bonus_explain_script entitlement
 *
 * Funnel copy intentionally omits the dashboard's ™ glyphs (matching the
 * existing teaser convention; cf. signature.unlockTeaser). Nothing here is a
 * diagnosis — these are the names of educational focus-pattern outputs.
 */
export const PROFILE_SECTIONS = {
  radar: "Executive Function Radar",
  cognitiveSignature: "Cognitive Signature",
  conditions: "Best Focus Conditions",
  taskInitiation: "Task Initiation Style",
  recovery: "Recovery Style",
  explainScript: "Explain-It-To-Someone Script",
} as const;

/**
 * The three locked rows shown (blurred) in the result preview. They name the
 * concrete outputs the purchase unlocks rather than abstract "full plan" copy:
 *   1. the six-dimension Executive Function Radar;
 *   2. Best Focus Conditions plus Task Initiation / Recovery guidance;
 *   3. one pattern-specific practical starting point — unique per signature.
 *
 * The teaser deliberately shows the TYPE and CONTEXT of each output (e.g. "your
 * first step for a day with no deadline pushing you") and never the full paid
 * instruction. Always exactly three rows.
 */
export function resultLockedRows(signatureKey: string): string[] {
  return [
    `Your six-dimension ${PROFILE_SECTIONS.radar}`,
    `Your ${PROFILE_SECTIONS.conditions}, ${PROFILE_SECTIONS.taskInitiation} and ${PROFILE_SECTIONS.recovery}`,
    firstStepTeaserFor(signatureKey),
  ];
}

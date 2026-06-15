/**
 * Single source of truth for the buyer-facing copy that previews the paid Brain
 * Profile — shared by the result locked preview (ChartScreen) and the paywall
 * offer (paywallContent) so the two surfaces stay in sync.
 *
 * The copy is written as practical outcomes, NOT internal dashboard section
 * names, but every line translates a real shipped section of BrainProfileView
 * for the brain_profile entitlement bundle:
 *   - "6-point map …"            → Executive Function Radar (six radarDimensions)
 *                                  + Strengths / Friction Points
 *   - "conditions that help you
 *      start, stay …, recover"   → Best Focus Conditions + Task Initiation Style
 *                                  + Recovery Style
 *   - per-signature outcome      → the pattern-specific focus the profile centers on
 *   - "explanation you can …
 *      share"                    → Explain-It-To-Someone Script, granted with the
 *                                  Brain Profile via the bonus_explain_script entitlement
 * Nothing here is a diagnosis — these are educational focus-pattern outcomes.
 */

/**
 * The approved per-signature third locked row: a practical, benefit-focused
 * outcome that stays unique per pattern. Not a separate "first step" artifact —
 * it names the outcome the profile helps the reader reach.
 */
const SIGNATURE_OUTCOME: Record<string, string> = {
  Sprinter: "How to build momentum that doesn’t depend on urgency",
  Archivist: "How to find the next clear move when too much is competing for attention",
  Spark: "How to keep moving after the initial excitement fades",
  Reactor: "How to regain traction when stress knocks the day off course",
  Drifter: "How to create enough structure to start and stay with what matters",
};

const SIGNATURE_OUTCOME_FALLBACK =
  "How to work with your focus pattern instead of against it";

export function signatureOutcomeFor(signatureKey: string): string {
  return SIGNATURE_OUTCOME[signatureKey] ?? SIGNATURE_OUTCOME_FALLBACK;
}

/**
 * The three locked rows shown (blurred) in the result preview, as practical
 * outcomes. Rows 1–2 are shared; row 3 varies by signature. Always exactly
 * three rows, and never the words "first step" or an internal section name.
 */
export function resultLockedRows(signatureKey: string): string[] {
  return [
    "A 6-point map of where your focus holds — and where it breaks",
    "The conditions that help you start, stay on track, and recover when focus slips",
    signatureOutcomeFor(signatureKey),
  ];
}

/**
 * The three paywall deliverables, as customer outcomes. Each translates a real
 * shipped section into value: the radar + strengths/friction, the focus
 * conditions + initiation/recovery guidance, and the Explain-It-To-Someone
 * Script. No internal section names; exactly three.
 */
export const PAYWALL_DELIVERABLES: readonly string[] = [
  "A 6-point map of your strongest focus patterns and biggest friction points",
  "Your personalized conditions for starting, staying on track, and recovering when focus slips",
  "A clear explanation of your pattern you can use yourself or share with someone else",
];

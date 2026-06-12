/**
 * One concrete, pattern-specific withheld deliverable per signature.
 * Shown as the lead locked row on the result screen and as the locked
 * next-step teaser in the email-capture preview — "full plan" stays
 * abstract without one exact thing being withheld. UI copy only;
 * never persisted.
 */
export const FIRST_STEP_TEASER: Record<string, string> = {
  Sprinter: "Your first step for a day with no deadline pushing you",
  Archivist: "Your first step for when the list is already overwhelming",
  Spark: "Your first step for restarting a project that went quiet",
  Reactor: "Your first short reset for a day that got derailed",
  Drifter: "Your first anchor to place before tomorrow morning",
};

export function firstStepTeaserFor(signatureKey: string): string {
  return (
    FIRST_STEP_TEASER[signatureKey] ??
    "Your first next step, sized to your pattern"
  );
}

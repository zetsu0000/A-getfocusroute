/**
 * Narrative stage index (1-5) for each infocard, used to ramp the shared
 * SignalFieldGL coherence (scattered noise → organized route) across the cards.
 *
 * Kept in its own tiny module so QuizEngine can read it WITHOUT pulling the
 * heavy infocard module (gsap + the five card components) into the quiz bundle.
 */
export const INFOCARD_STAGE: Record<string, number> = {
  "info-seen": 1,
  "info-match": 2,
  "info-focus": 3,
  "info-system": 4,
  "adhd-profile": 5,
};

import { QuizAnswer } from "@/types/quiz";

/*
 * FocusRoute result engine — deterministic, answer-derived.
 *
 * The archetype (BrainSignature) is chosen by scoring the user's ACTUAL
 * answers against five focus patterns, then taking the highest affinity.
 * It is NOT a hash or a random draw: the same answers always produce the
 * same result, and different answer patterns produce meaningfully different
 * results. Ties resolve deterministically by ORDER, and an answer set with no
 * recognizable signal falls back to the neutral Drifter pattern.
 *
 * The five keys (Sprinter/Archivist/Spark/Reactor/Drifter) are unchanged, so
 * every rendering layer (SignatureRevealCard, signature-identity palette,
 * dashboard) and every previously stored result stays fully compatible — only
 * the *selection* logic changed.
 *
 * Nothing here is a diagnosis or a medical claim. It is a focus-pattern map.
 */

export type BrainSignature =
  | "Sprinter"
  | "Archivist"
  | "Spark"
  | "Reactor"
  | "Drifter";

export interface SignatureResult {
  signature: BrainSignature;
  title: string;
  preview: string;
  strengths: string[];
  unlockTeaser: string[];
  /** Plain-language line: where this pattern's momentum tends to break. UI only, not persisted. */
  frictionLine: string;
  /** What the paid plan centers on for this pattern. UI only, not persisted. */
  planFocus: string;
}

const SIGNATURES: Record<BrainSignature, Omit<SignatureResult, "signature">> = {
  Sprinter: {
    title: "Fast starts, uneven finish lines",
    preview:
      "You move quickly when something feels urgent, but routine, low-pressure tasks tend to stall without a clear trigger to start.",
    strengths: [
      "High momentum in short bursts",
      "Strong problem solving under time pressure",
      "Responds well to visible deadlines and checkpoints",
    ],
    unlockTeaser: [
      "Your full focus-pattern breakdown",
      "A consistency plan that doesn't depend on last-minute pressure",
      "A 28-day, day-by-day routine you can actually keep",
    ],
    frictionLine:
      "Your momentum tends to break on routine, low-urgency tasks once the pressure is off.",
    planFocus: "building consistency that doesn't rely on last-minute pressure",
  },
  Archivist: {
    title: "Detail-rich, load-sensitive",
    preview:
      "You notice details and context quickly, but the load builds fast when tasks stack up or priorities aren't clear.",
    strengths: [
      "Strong memory for context and specifics",
      "Excellent quality control and pattern-spotting",
      "Performs best with clear structure and prep time",
    ],
    unlockTeaser: [
      "Your full focus-pattern breakdown",
      "A clear order-of-operations for when tasks pile up",
      "A 28-day plan to cut overwhelm and finish cleanly",
    ],
    frictionLine:
      "Your momentum tends to break when tasks stack up and priorities get unclear.",
    planFocus: "cutting overload and giving you a clear order of operations",
  },
  Spark: {
    title: "Idea-driven, novelty-powered",
    preview:
      "You build momentum through curiosity and new ideas, then need a system to carry a strong start through to a finish.",
    strengths: [
      "High idea generation and creative thinking",
      "Strong engagement when work feels meaningful",
      "Quick to adapt when things change",
    ],
    unlockTeaser: [
      "Your full focus-pattern breakdown",
      "A follow-through system for when the novelty fades",
      "A 28-day plan that turns starts into finishes",
    ],
    frictionLine:
      "Your momentum tends to break the moment a task stops feeling new or interesting.",
    planFocus: "carrying good starts through to finished, even after the novelty fades",
  },
  Reactor: {
    title: "Responsive, pressure-sensitive",
    preview:
      "You respond fast to demands and changes, but stress or a heavy mood can pull focus and disrupt the rest of the day.",
    strengths: [
      "Fast, responsive thinking in changing situations",
      "Strong read on what a moment needs",
      "Recovers quickly with a clear reset",
    ],
    unlockTeaser: [
      "Your full focus-pattern breakdown",
      "A reset routine for high-stress, low-focus days",
      "A 28-day plan to keep one rough moment from sinking the day",
    ],
    frictionLine:
      "Your momentum tends to break when stress or a bad mood takes over the day.",
    planFocus: "steadying your focus so one rough moment doesn't sink the whole day",
  },
  Drifter: {
    title: "Flexible attention, anchor-seeking",
    preview:
      "Your attention can drift when there's nothing concrete pulling it back — especially on low-stimulation work or long timelines.",
    strengths: [
      "Calm and steady in low-pressure settings",
      "Can focus deeply when the task feels clear and meaningful",
      "Benefits quickly from light, simple structure",
    ],
    unlockTeaser: [
      "Your full focus-pattern breakdown",
      "Simple anchors that make it easier to start",
      "A 28-day plan to hold attention without relying on willpower",
    ],
    frictionLine:
      "Your momentum tends to break when there's nothing concrete pulling your attention back.",
    planFocus: "adding simple anchors so it's easier to start and stay on track",
  },
};

/* Tie-break / fallback order. Strict-greater comparison means the first key in
   this list wins on a tie; an all-zero score falls back to Drifter (neutral). */
const ORDER: BrainSignature[] = [
  "Sprinter",
  "Archivist",
  "Spark",
  "Reactor",
  "Drifter",
];

/* ── Answer accessors ─────────────────────────────────────────── */
function single(answers: QuizAnswer[], qid: string): string | undefined {
  return answers.find((a) => a.questionId === qid)?.selectedOptions[0];
}
function multi(answers: QuizAnswer[], qid: string): string[] {
  return answers.find((a) => a.questionId === qid)?.selectedOptions ?? [];
}
function scaleVal(answers: QuizAnswer[], qid: string): number {
  const raw = single(answers, qid);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Affinity score per archetype, derived entirely from selected answer ids.
 * Exported for testing and transparency.
 */
export function scoreArchetypes(
  answers: QuizAnswer[],
): Record<BrainSignature, number> {
  const ff = single(answers, "focus-feeling");
  const struggles = multi(answers, "struggles");
  const obstacles = multi(answers, "obstacles");
  const goals = multi(answers, "goals");
  const mood = single(answers, "mood");
  const distraction = single(answers, "distraction");
  const experience = single(answers, "experience");
  const support = single(answers, "support");

  const s: Record<BrainSignature, number> = {
    Sprinter: 0,
    Archivist: 0,
    Spark: 0,
    Reactor: 0,
    Drifter: 0,
  };

  // Drifter — scattered attention / hard to start / pulled off track.
  if (ff === "cant-start") s.Drifter += 3;
  if (ff === "behind") s.Drifter += 1;
  if (distraction === "often" || distraction === "always") s.Drifter += 2;
  else if (distraction === "sometimes") s.Drifter += 1;
  if (obstacles.includes("distraction")) s.Drifter += 3;
  if (goals.includes("focus")) s.Drifter += 1;
  if (support === "none") s.Drifter += 1;

  // Spark — novelty-driven; focus fades when interest fades.
  if (scaleVal(answers, "scale-focus") >= 4) s.Spark += 3;
  if (obstacles.includes("motivation")) s.Spark += 2;
  if (struggles.includes("depression")) s.Spark += 2;
  if (ff === "stall") s.Spark += 2;
  if (goals.includes("creativity")) s.Spark += 1;

  // Sprinter — fast starts; routines/consistency don't hold.
  if (struggles.includes("burnout")) s.Sprinter += 3;
  if (obstacles.includes("consistency")) s.Sprinter += 3;
  if (experience === "tried" || experience === "yes") s.Sprinter += 1;
  if (ff === "stall") s.Sprinter += 1;
  if (mood === "never" || mood === "rarely") s.Sprinter += 1;

  // Archivist — overload-sensitive; details stack up.
  if (scaleVal(answers, "scale-overwhelm") >= 4) s.Archivist += 3;
  if (struggles.includes("ocd")) s.Archivist += 3;
  if (ff === "heavy") s.Archivist += 2;
  if (ff === "behind") s.Archivist += 1;
  if (goals.includes("memory")) s.Archivist += 1;
  if (scaleVal(answers, "scale-memory") >= 4) s.Archivist += 1;
  if (obstacles.includes("method")) s.Archivist += 1;

  // Reactor — emotion/pressure-driven derailment.
  if (scaleVal(answers, "scale-emotions") >= 4) s.Reactor += 3;
  if (struggles.includes("anxiety")) s.Reactor += 3;
  if (mood === "often" || mood === "always") s.Reactor += 2;
  if (obstacles.includes("time")) s.Reactor += 1;
  if (goals.includes("stress")) s.Reactor += 1;

  return s;
}

export function getSignatureFromAnswers(answers: QuizAnswer[]): SignatureResult {
  const scores = scoreArchetypes(answers);

  let best: BrainSignature = "Drifter";
  let bestScore = 0;
  for (const key of ORDER) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }

  // No recognizable signal at all → neutral, non-alarming fallback.
  const signature: BrainSignature = bestScore === 0 ? "Drifter" : best;
  return { signature, ...SIGNATURES[signature] };
}

/**
 * Up to three short, recognizable reflections built from the user's OWN
 * selected answers (their words, lightly humanized). Prioritized by how
 * defining the signal is. Empty answers → []. Deterministic.
 */
export function getAnswerEchoes(answers: QuizAnswer[]): string[] {
  const ff = single(answers, "focus-feeling");
  const struggles = multi(answers, "struggles");
  const obstacles = multi(answers, "obstacles");
  const distraction = single(answers, "distraction");

  const echoes: string[] = [];
  const add = (s: string) => {
    if (echoes.length < 3 && !echoes.includes(s)) echoes.push(s);
  };

  // Lead with their headline pain.
  if (ff === "cant-start") add("getting started is the hardest part");
  else if (ff === "stall") add("you start strong, then stall partway");
  else if (ff === "heavy") add("simple tasks feel heavier than they should");
  else if (ff === "behind") add("you're busy but still feel behind");

  // Strongest scale signals.
  if (scaleVal(answers, "scale-overwhelm") >= 4) add("too much at once makes you freeze");
  if (scaleVal(answers, "scale-focus") >= 4) add("focus slips once something gets boring");
  if (scaleVal(answers, "scale-emotions") >= 4) add("a rough mood can derail your whole day");
  if (scaleVal(answers, "scale-organization") >= 4) add("you know the goal but not the next step");
  if (scaleVal(answers, "scale-memory") >= 4) add("if it isn't written down, it's gone");

  // Self-identified struggles.
  if (struggles.includes("burnout")) add("routines don't stick");
  if (struggles.includes("ocd")) add("details pile up on you");
  if (struggles.includes("depression")) add("momentum slips away fast");
  if (struggles.includes("anxiety")) add("starting can feel too big");
  if (struggles.includes("other")) add("when plans change, things fall through");

  // What breaks the streak.
  if (obstacles.includes("consistency")) add("it's hard to keep things going");
  if (obstacles.includes("motivation")) add("day-one energy fades fast");
  if (obstacles.includes("distraction")) add("distractions pull you off track");
  if (distraction === "often" || distraction === "always") add("time slips away most days");

  return echoes;
}

/** Natural-language version of the echoes, e.g. "You told us A, B, and C." */
export function echoSentence(answers: QuizAnswer[]): string | null {
  const e = getAnswerEchoes(answers);
  if (e.length === 0) return null;
  if (e.length === 1) return `You told us ${e[0]}.`;
  if (e.length === 2) return `You told us ${e[0]} and ${e[1]}.`;
  return `You told us ${e[0]}, ${e[1]}, and ${e[2]}.`;
}

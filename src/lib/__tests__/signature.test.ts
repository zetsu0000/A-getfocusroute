import { describe, expect, it } from "vitest";

import {
  getSignatureFromAnswers,
  getAnswerEchoes,
  echoSentence,
  scoreArchetypes,
  type BrainSignature,
} from "../signature";
import { scoreFromAnswers } from "../symptom-level";
import type { QuizAnswer } from "@/types/quiz";

/** Build a QuizAnswer[] from a compact { questionId: option(s) } map. */
function build(map: Record<string, string | string[]>): QuizAnswer[] {
  return Object.entries(map).map(([questionId, v]) => ({
    questionId,
    selectedOptions: Array.isArray(v) ? v : [v],
  }));
}

/* Representative answer patterns, each engineered to lean to one archetype. */
const PATTERNS: Record<BrainSignature, QuizAnswer[]> = {
  Drifter: build({
    "focus-feeling": "cant-start",
    distraction: "always",
    obstacles: ["distraction"],
  }),
  Spark: build({
    "focus-feeling": "stall",
    "scale-focus": "5",
    obstacles: ["motivation"],
    struggles: ["depression"],
  }),
  Sprinter: build({
    "focus-feeling": "stall",
    struggles: ["burnout"],
    obstacles: ["consistency"],
    experience: "tried",
  }),
  Archivist: build({
    "focus-feeling": "heavy",
    "scale-overwhelm": "5",
    struggles: ["ocd"],
  }),
  Reactor: build({
    "focus-feeling": "behind",
    "scale-emotions": "5",
    struggles: ["anxiety"],
    mood: "always",
  }),
};

describe("getSignatureFromAnswers", () => {
  it("is deterministic — same answers always produce the same signature", () => {
    const a = PATTERNS.Spark;
    expect(getSignatureFromAnswers(a).signature).toBe(
      getSignatureFromAnswers(a).signature,
    );
    // And again across a fresh copy with the same content.
    const copy = build({
      "focus-feeling": "stall",
      "scale-focus": "5",
      obstacles: ["motivation"],
      struggles: ["depression"],
    });
    expect(getSignatureFromAnswers(copy).signature).toBe("Spark");
  });

  it("maps each engineered pattern to its intended archetype", () => {
    (Object.keys(PATTERNS) as BrainSignature[]).forEach((key) => {
      expect(getSignatureFromAnswers(PATTERNS[key]).signature).toBe(key);
    });
  });

  it("produces meaningfully different framing for different patterns", () => {
    const drifter = getSignatureFromAnswers(PATTERNS.Drifter);
    const archivist = getSignatureFromAnswers(PATTERNS.Archivist);
    expect(drifter.signature).not.toBe(archivist.signature);
    expect(drifter.frictionLine).not.toBe(archivist.frictionLine);
    expect(drifter.planFocus).not.toBe(archivist.planFocus);
  });

  it("returns the neutral Drifter fallback for empty / unrecognized answers", () => {
    expect(getSignatureFromAnswers([]).signature).toBe("Drifter");
    expect(getSignatureFromAnswers(build({ age: "25-34" })).signature).toBe(
      "Drifter",
    );
  });

  it("always returns complete, non-empty result framing", () => {
    (Object.keys(PATTERNS) as BrainSignature[]).forEach((key) => {
      const r = getSignatureFromAnswers(PATTERNS[key]);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.strengths).toHaveLength(3);
      expect(r.unlockTeaser).toHaveLength(3);
      expect(r.frictionLine.length).toBeGreaterThan(0);
      expect(r.planFocus.length).toBeGreaterThan(0);
      // No leftover trademark / fake-science glyphs in stored-facing copy.
      expect(r.unlockTeaser.join(" ")).not.toContain("™");
    });
  });

  it("handles malformed scale values without throwing", () => {
    const a = build({ "scale-overwhelm": ["not-a-number"], "focus-feeling": "heavy" });
    expect(() => getSignatureFromAnswers(a)).not.toThrow();
    // The bad scale contributes nothing; "heavy" still leans Archivist.
    expect(getSignatureFromAnswers(a).signature).toBe("Archivist");
  });
});

describe("scoreArchetypes", () => {
  it("gives the intended archetype the strictly highest affinity", () => {
    (Object.keys(PATTERNS) as BrainSignature[]).forEach((key) => {
      const scores = scoreArchetypes(PATTERNS[key]);
      const max = Math.max(...Object.values(scores));
      expect(scores[key]).toBe(max);
    });
  });

  it("returns all-zero affinities for empty answers", () => {
    const scores = scoreArchetypes([]);
    expect(Object.values(scores).every((v) => v === 0)).toBe(true);
  });
});

describe("getAnswerEchoes / echoSentence", () => {
  it("echoes the user's own selected pains (max 3, deduped)", () => {
    const echoes = getAnswerEchoes(PATTERNS.Drifter);
    expect(echoes.length).toBeGreaterThan(0);
    expect(echoes.length).toBeLessThanOrEqual(3);
    expect(new Set(echoes).size).toBe(echoes.length);
    expect(echoes[0]).toBe("getting started is the hardest part");
    expect(echoes).toContain("distractions pull you off track");
  });

  it("reflects a different headline pain for a different opener", () => {
    const heavy = getAnswerEchoes(build({ "focus-feeling": "heavy" }));
    expect(heavy).toContain("simple tasks feel heavier than they should");
    const stall = getAnswerEchoes(build({ "focus-feeling": "stall" }));
    expect(stall).toContain("you start strong, then stall partway");
  });

  it("builds a natural sentence, or null when there is nothing to echo", () => {
    expect(echoSentence(PATTERNS.Spark)).toMatch(/^You told us .+\.$/);
    expect(getAnswerEchoes([])).toEqual([]);
    expect(echoSentence([])).toBeNull();
    expect(echoSentence(build({ age: "25-34" }))).toBeNull();
  });

  it("is deterministic", () => {
    expect(getAnswerEchoes(PATTERNS.Reactor)).toEqual(
      getAnswerEchoes(PATTERNS.Reactor),
    );
  });
});

describe("scoreFromAnswers (focus-friction score)", () => {
  it("returns a neutral score when nothing usable is answered", () => {
    expect(scoreFromAnswers([])).toBe(57);
    expect(scoreFromAnswers(build({ age: "25-34" }))).toBe(57);
  });

  it("scores a heavy-friction pattern higher than a light one", () => {
    const heavy = scoreFromAnswers(
      build({
        distraction: "always",
        mood: "always",
        "scale-procrastination": "5",
        "scale-focus": "5",
        "scale-overwhelm": "5",
        "scale-organization": "5",
        "scale-memory": "5",
        "scale-emotions": "5",
      }),
    );
    const light = scoreFromAnswers(
      build({
        distraction: "never",
        mood: "never",
        "scale-procrastination": "1",
        "scale-focus": "1",
        "scale-overwhelm": "1",
        "scale-organization": "1",
        "scale-memory": "1",
        "scale-emotions": "1",
      }),
    );
    expect(heavy).toBeGreaterThan(80);
    expect(light).toBeLessThan(25);
    expect(heavy).toBeGreaterThan(light);
  });

  it("stays within 0-100 and is deterministic", () => {
    const a = build({ distraction: "often", "scale-overwhelm": "4" });
    const score = scoreFromAnswers(a);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(scoreFromAnswers(a)).toBe(score);
  });
});

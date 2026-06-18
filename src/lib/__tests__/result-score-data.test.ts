import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { deriveBrainProfile } from "@/lib/dashboard/brain-profile";
import { getSignatureFromAnswers, type BrainSignature } from "@/lib/signature";
import { hasUsableScoreSignal, scoreFromAnswers } from "@/lib/symptom-level";
import type { QuizAnswer } from "@/types/quiz";
import {
  RESULT_SCORE_MAX,
  RESULT_SCORE_MIN,
  normalizeQuizAnswers,
  resolveResultScoreData,
  resolveResultScoreDataFromQuizRow,
} from "../result-score-data";

function build(map: Record<string, string | string[]>): QuizAnswer[] {
  return Object.entries(map).map(([questionId, v]) => ({
    questionId,
    selectedOptions: Array.isArray(v) ? v : [v],
  }));
}

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

const heavyAnswers = build({
  distraction: "always",
  mood: "always",
  "scale-procrastination": "5",
  "scale-focus": "5",
  "scale-overwhelm": "5",
  "scale-organization": "5",
  "scale-memory": "5",
  "scale-emotions": "5",
});

const lightAnswers = build({
  distraction: "never",
  mood: "never",
  "scale-procrastination": "1",
  "scale-focus": "1",
  "scale-overwhelm": "1",
  "scale-organization": "1",
  "scale-memory": "1",
  "scale-emotions": "1",
});

describe("resolveResultScoreData", () => {
  it("returns computed score for current in-memory answers", () => {
    const result = resolveResultScoreData({ answers: heavyAnswers });
    expect(result).toEqual({
      value: scoreFromAnswers(heavyAnswers),
      minimum: RESULT_SCORE_MIN,
      maximum: RESULT_SCORE_MAX,
      source: "computed",
    });
  });

  it("prefers a valid stored score over recomputation", () => {
    const computed = scoreFromAnswers(heavyAnswers);
    const result = resolveResultScoreData({
      answers: heavyAnswers,
      storedScore: 42,
    });
    expect(result).toEqual({
      value: 42,
      minimum: RESULT_SCORE_MIN,
      maximum: RESULT_SCORE_MAX,
      source: "stored",
    });
    expect(result?.value).not.toBe(computed);
  });

  it("computes from stored answers when no score field exists", () => {
    const row = { answers: heavyAnswers };
    expect(resolveResultScoreDataFromQuizRow(row)).toMatchObject({
      value: scoreFromAnswers(heavyAnswers),
      source: "computed",
    });
  });

  it("returns null for empty answers without a stored score", () => {
    expect(resolveResultScoreData({ answers: [] })).toBeNull();
    expect(resolveResultScoreDataFromQuizRow({ answers: [] })).toBeNull();
  });

  it("returns null for legacy rows missing score and usable answers", () => {
    expect(
      resolveResultScoreDataFromQuizRow({
        answers: [{ questionId: "age", selectedOptions: ["25-34"] }],
      }),
    ).toBeNull();
    expect(resolveResultScoreDataFromQuizRow({ signature_key: "Drifter" })).toBeNull();
    expect(resolveResultScoreDataFromQuizRow(null)).toBeNull();
  });

  it("computes from legacy rows that lack a score but include scored answers", () => {
    const legacyAnswers = build({ distraction: "sometimes", "scale-focus": "3" });
    expect(
      resolveResultScoreDataFromQuizRow({
        answers: legacyAnswers,
        signature_key: "Drifter",
      }),
    ).toMatchObject({
      value: scoreFromAnswers(legacyAnswers),
      source: "computed",
    });
  });

  it("rejects malformed stored scores and falls back to compute when possible", () => {
    expect(
      resolveResultScoreData({
        answers: heavyAnswers,
        storedScore: Number.NaN,
      })?.source,
    ).toBe("computed");
    expect(
      resolveResultScoreData({
        answers: heavyAnswers,
        storedScore: 150,
      })?.source,
    ).toBe("computed");
    expect(
      resolveResultScoreData({
        answers: [],
        storedScore: "not-a-number",
      }),
    ).toBeNull();
    expect(
      resolveResultScoreData({
        answers: build({ distraction: "invalid-value" }),
        storedScore: 150,
      }),
    ).toBeNull();
  });

  it("returns null for invalid frequency values with no other valid signal", () => {
    expect(
      resolveResultScoreData({
        answers: build({ distraction: "invalid-value" }),
      }),
    ).toBeNull();
    expect(
      resolveResultScoreData({
        answers: build({ mood: "unknown" }),
      }),
    ).toBeNull();
    expect(hasUsableScoreSignal(build({ distraction: "invalid-value" }))).toBe(false);
    expect(scoreFromAnswers(build({ distraction: "invalid-value" }))).toBe(57);
  });

  it("returns null for invalid scale values with no other valid signal", () => {
    for (const value of ["0", "6", "9", "abc", ""]) {
      expect(
        resolveResultScoreData({
          answers: build({ "scale-focus": value }),
        }),
      ).toBeNull();
      expect(hasUsableScoreSignal(build({ "scale-focus": value }))).toBe(false);
    }
  });

  it("computes from mixed valid and invalid answers using only valid signals", () => {
    const answers = build({
      distraction: "invalid-value",
      "scale-focus": "4",
    });
    expect(resolveResultScoreData({ answers })).toMatchObject({
      value: scoreFromAnswers(answers),
      source: "computed",
    });
    expect(scoreFromAnswers(answers)).toBe(76);
  });

  it("accepts canonical frequency and scale boundaries", () => {
    for (const freq of ["never", "rarely", "sometimes", "often", "always"] as const) {
      const result = resolveResultScoreData({ answers: build({ distraction: freq }) });
      expect(result?.source).toBe("computed");
      expect(result?.value).toBe(scoreFromAnswers(build({ distraction: freq })));
    }
    for (const scale of ["1", "5"] as const) {
      const result = resolveResultScoreData({
        answers: build({ "scale-focus": scale }),
      });
      expect(result?.source).toBe("computed");
      expect(result?.value).toBe(scoreFromAnswers(build({ "scale-focus": scale })));
    }
  });

  it("does not read speculative stored-score fields from quiz rows", () => {
    expect(
      resolveResultScoreDataFromQuizRow({
        answers: heavyAnswers,
        friction_score: 55,
        focus_friction_score: 61,
      }),
    ).toMatchObject({
      value: scoreFromAnswers(heavyAnswers),
      source: "computed",
    });
  });

  it("is deterministic and order-independent for the same answer content", () => {
    const shuffled = [...heavyAnswers].reverse();
    const a = resolveResultScoreData({ answers: heavyAnswers });
    const b = resolveResultScoreData({ answers: shuffled });
    expect(a).toEqual(b);
    expect(a?.value).toBe(scoreFromAnswers(heavyAnswers));
  });

  it("keeps scores within the canonical range without NaN or Infinity", () => {
    for (const answers of [heavyAnswers, lightAnswers, PATTERNS.Reactor, []]) {
      const result = resolveResultScoreData({ answers });
      if (answers.length === 0) {
        expect(result).toBeNull();
        continue;
      }
      expect(result?.value).toBeGreaterThanOrEqual(RESULT_SCORE_MIN);
      expect(result?.value).toBeLessThanOrEqual(RESULT_SCORE_MAX);
      expect(Number.isFinite(result?.value)).toBe(true);
    }
  });

  it("does not mutate answer payloads", () => {
    const answers = build({ distraction: "often", "scale-focus": "4" });
    const snapshot = structuredClone(answers);
    resolveResultScoreData({ answers });
    expect(answers).toEqual(snapshot);
  });
});

describe("normalizeQuizAnswers", () => {
  it("skips malformed rows while keeping valid ones", () => {
    expect(
      normalizeQuizAnswers([
        { questionId: "distraction", selectedOptions: ["often"] },
        { questionId: 42, selectedOptions: ["x"] },
        null,
        { questionId: "mood", selectedOptions: [123, "never"] },
      ]),
    ).toEqual([
      { questionId: "distraction", selectedOptions: ["often"] },
      { questionId: "mood", selectedOptions: ["never"] },
    ]);
  });
});

describe("algorithm preservation", () => {
  it("matches scoreFromAnswers for representative answer sets", () => {
    const sets = [
      heavyAnswers,
      lightAnswers,
      build({ distraction: "often", "scale-overwhelm": "4" }),
      build({ age: "25-34", distraction: "sometimes" }),
    ];
    for (const answers of sets) {
      const direct = scoreFromAnswers(answers);
      const resolved = resolveResultScoreData({ answers });
      expect(resolved?.value).toBe(direct);
    }
  });

  it("does not change signature assignment for representative answer sets", () => {
    for (const key of Object.keys(PATTERNS) as BrainSignature[]) {
      const answers = PATTERNS[key];
      const before = getSignatureFromAnswers(answers);
      resolveResultScoreData({ answers });
      const after = getSignatureFromAnswers(answers);
      expect(after).toEqual(before);
    }
  });

  it("does not change brain profile radar dimensions for representative answer sets", () => {
    for (const key of Object.keys(PATTERNS) as BrainSignature[]) {
      const answers = PATTERNS[key];
      const sig = getSignatureFromAnswers(answers);
      const before = deriveBrainProfile(answers, sig.title, sig.preview);
      resolveResultScoreData({ answers });
      const after = deriveBrainProfile(answers, sig.title, sig.preview);
      expect(after.radarDimensions).toEqual(before.radarDimensions);
      expect(after.overallScore).toBe(before.overallScore);
    }
  });
});

describe("result screen UI guard", () => {
  const chartSrc = readFileSync(
    fileURLToPath(new URL("../../components/chart/ChartScreen.tsx", import.meta.url)),
    "utf8",
  );

  it("does not render the focus-friction score yet", () => {
    expect(chartSrc).not.toContain("scoreFromAnswers");
    expect(chartSrc).not.toContain("resolveResultScoreData");
    expect(chartSrc).not.toContain("score.toFixed");
    expect(chartSrc).not.toMatch(/Friction snapshot.*\{\s*score/i);
  });
});

describe("checkout analytics guard", () => {
  const subscriptionSrc = readFileSync(
    fileURLToPath(
      new URL("../../components/subscription/SubscriptionPlansScreen.tsx", import.meta.url),
    ),
    "utf8",
  );

  it("preserves PR #49 subscription funnel analytics instrumentation", () => {
    expect(subscriptionSrc).toContain("resolvePaymentFailureMetadata");
    expect(subscriptionSrc).toContain("checkoutAnalyticsStorageKey");
    expect(subscriptionSrc).toContain("FIRST_PARTY_EVENTS.paymentAttempted");
  });
});

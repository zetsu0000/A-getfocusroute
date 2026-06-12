import { describe, expect, it } from "vitest";

import { questions, progressQuestions } from "../questions";

/*
 * Structural contract for the 15-question assessment (funnel audit cut).
 * Guards two things: the quiz stays at its intended length, and every id
 * that scoring / personalization reads is still asked. If a future edit
 * removes a load-bearing question, this fails before the funnel does.
 */

/* Read by scoreArchetypes (signature.ts), scoreFromAnswers (symptom-level.ts),
   getAnswerEchoes, and/or deriveBrainProfile (dashboard radar + copy). */
const LOAD_BEARING_IDS = [
  "focus-feeling",
  "mood",
  "distraction",
  "struggles",
  "experience",
  "goals",
  "time",
  "support",
  "obstacles",
  "scale-procrastination",
  "scale-focus",
  "scale-overwhelm",
  "scale-organization",
  "scale-memory",
  "scale-emotions",
];

/* Deliberately removed in the 15-question cut — nothing in scoring or
   result generation reads them. Re-adding is fine; update this list. */
const REMOVED_IDS = ["gender", "age", "sleep", "daily-impact", "motivation"];

describe("assessment structure (15-question cut)", () => {
  it("has exactly 15 scoreable questions", () => {
    expect(progressQuestions).toHaveLength(15);
  });

  it("opens with the strongest three questions in order", () => {
    expect(progressQuestions.slice(0, 3).map((q) => q.id)).toEqual([
      "focus-feeling",
      "mood",
      "distraction",
    ]);
  });

  it("still asks every id that scoring or personalization reads", () => {
    const ids = new Set(progressQuestions.map((q) => q.id));
    for (const id of LOAD_BEARING_IDS) {
      expect(ids.has(id), `missing load-bearing question: ${id}`).toBe(true);
    }
  });

  it("keeps all six scale statements (paid radar + snapshot score)", () => {
    const scales = progressQuestions.filter((q) => q.inputType === "scale");
    expect(scales).toHaveLength(6);
  });

  it("does not reintroduce the removed low-signal questions", () => {
    const ids = new Set(questions.map((q) => q.id));
    for (const id of REMOVED_IDS) {
      expect(ids.has(id), `removed question is back without review: ${id}`).toBe(false);
    }
  });

  it("has unique question ids", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the snapshot card variant key InfoCard.tsx routes on", () => {
    const snapshot = questions.find((q) => q.id === "adhd-profile");
    expect(snapshot?.inputType).toBe("info");
    expect(snapshot?.infoBody).toBe("adhd-profile");
  });

  it("info cards carry no options and never enter progress counts", () => {
    for (const q of questions.filter((q) => q.inputType === "info")) {
      expect(q.options).toHaveLength(0);
    }
    expect(progressQuestions.every((q) => q.inputType !== "info")).toBe(true);
  });
});

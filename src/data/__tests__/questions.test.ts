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

/*
 * Copy-only refinement (funnel clarity pass). Asserts the approved new strings
 * and the absence of the old ones, while reconfirming that the things scoring
 * and personalization actually read — ids, option ids, statements, order — are
 * untouched by the copy edit.
 */
describe("funnel copy refinement", () => {
  const byId = (id: string) => questions.find((q) => q.id === id);

  it("applies the approved new question and answer copy", () => {
    expect(byId("mood")?.question).toBe(
      "When your day goes off track, what usually happens?",
    );
    expect(byId("time")?.question).toBe("What feels realistic each day?");
    expect(byId("scale-emotions")?.question).toBe("Last pattern check.");

    const strugglesOther = byId("struggles")?.options.find((o) => o.id === "other");
    expect(strugglesOther?.label).toBe("Plans change and I lose the thread.");
  });

  it("standardizes the filler scale prompts on one clear prompt", () => {
    for (const id of ["scale-focus", "scale-overwhelm", "scale-memory"]) {
      expect(byId(id)?.question).toBe("How true is this for you?");
    }
  });

  it("removes the old repetitive/filler copy from active funnel questions", () => {
    const prompts = questions.map((q) => q.question);
    expect(prompts).not.toContain("When a day goes sideways?");
    expect(prompts).not.toContain("How much time can you give?");
    expect(prompts).not.toContain("This one?");
    expect(prompts).not.toContain("And this one?");
    expect(prompts).not.toContain("One more like this?");

    const labels = questions.flatMap((q) => q.options.map((o) => o.label));
    expect(labels).not.toContain("Plans change, I drop.");
  });

  it("leaves scale statements, option ids/values and order untouched", () => {
    // statements are what scoring/personalization read alongside ids — the copy
    // pass must not have touched them.
    expect(byId("scale-focus")?.statement).toBe("Once it's boring, my focus is gone.");
    expect(byId("scale-overwhelm")?.statement).toBe("Too much at once and I freeze.");
    expect(byId("scale-memory")?.statement).toBe("If I don't write it down, it's gone.");
    expect(byId("scale-emotions")?.statement).toBe("A bad mood can wreck my whole day.");

    // the struggles option keeps its id even though its label changed
    expect(byId("struggles")?.options.map((o) => o.id)).toEqual([
      "anxiety",
      "depression",
      "burnout",
      "ocd",
      "other",
      "none",
    ]);
    // daily-time option ids/badges unchanged
    expect(byId("time")?.options.map((o) => o.id)).toEqual([
      "5min",
      "10min",
      "20min",
      "30min",
    ]);

    // full progress order/ids unchanged by the copy edit
    expect(progressQuestions.map((q) => q.id)).toEqual([
      "focus-feeling",
      "mood",
      "distraction",
      "struggles",
      "experience",
      "goals",
      "time",
      "scale-procrastination",
      "scale-focus",
      "scale-overwhelm",
      "scale-organization",
      "scale-memory",
      "scale-emotions",
      "support",
      "obstacles",
    ]);
  });
});

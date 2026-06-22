import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  FOCUS_PATTERN,
  FOCUS_ROUTE_WEEKS,
  FOCUS_TOOLS,
  FORBIDDEN_POST_PURCHASE_TERMS,
  POST_PURCHASE_SECTIONS,
  RETAKE_QUIZ,
  TODAYS_FOCUS_MOVE,
} from "@/lib/dashboard/post-purchase-content";

/*
 * The dashboard overview components are server/client React with no DOM test
 * environment, so these guard the copy via the shared content module (the single
 * source of truth the view renders from) plus source-level checks on the view.
 */
const viewSrc = readFileSync(
  fileURLToPath(new URL("../DashboardHomeView.tsx", import.meta.url)),
  "utf8",
);
const retakeSrc = readFileSync(
  fileURLToPath(new URL("../RetakeQuizCard.tsx", import.meta.url)),
  "utf8",
);

function allVisibleCopy(): string[] {
  return [
    ...Object.values(POST_PURCHASE_SECTIONS),
    TODAYS_FOCUS_MOVE.eyebrow,
    TODAYS_FOCUS_MOVE.title,
    TODAYS_FOCUS_MOVE.lead,
    TODAYS_FOCUS_MOVE.cta,
    ...TODAYS_FOCUS_MOVE.steps,
    ...FOCUS_TOOLS.flatMap((t) => [t.name, t.useWhen, t.gain]),
    ...FOCUS_ROUTE_WEEKS.flatMap((w) => [w.label, w.benefit]),
    FOCUS_PATTERN.intro,
    ...FOCUS_PATTERN.cards.flatMap((c) => [c.title, c.body]),
    RETAKE_QUIZ.title,
    RETAKE_QUIZ.body,
    RETAKE_QUIZ.cta,
  ];
}

describe("post-purchase dashboard sections", () => {
  it("exposes the five sections in the required order", () => {
    expect(Object.values(POST_PURCHASE_SECTIONS)).toEqual([
      "Today’s Focus Move",
      "Focus Tools",
      "28-Day FocusRoute",
      "Your Focus Pattern",
      "Retake the quiz",
    ]);
  });

  it("renders every section from the shared content module", () => {
    expect(viewSrc).toContain("TODAYS_FOCUS_MOVE");
    expect(viewSrc).toContain("FOCUS_TOOLS");
    expect(viewSrc).toContain("FOCUS_ROUTE_WEEKS");
    expect(viewSrc).toContain("FOCUS_PATTERN");
    expect(viewSrc).toContain("RetakeQuizCard");
    expect(retakeSrc).toContain("RETAKE_QUIZ");
  });
});

describe("Today’s Focus Move", () => {
  it("leads with one immediately useful action and a 4-step list", () => {
    expect(TODAYS_FOCUS_MOVE.title).toBe("Today’s Focus Move");
    expect(TODAYS_FOCUS_MOVE.lead).toBe("Start with one task that has a visible first step.");
    expect(TODAYS_FOCUS_MOVE.steps).toEqual([
      "Pick one task.",
      "Write the first physical step.",
      "Work for 15 minutes.",
      "Leave a return note if interrupted.",
    ]);
    expect(TODAYS_FOCUS_MOVE.cta).toBe("Start today’s focus move");
  });
});

describe("Focus Tools", () => {
  it("includes all six named tools (not scripts, not bonuses)", () => {
    expect(FOCUS_TOOLS.map((t) => t.name)).toEqual([
      "First Step Builder",
      "Priority Filter",
      "Comeback Note",
      "2-Minute Reset",
      "15-Minute Focus Block",
      "Explain My Focus Pattern",
    ]);
  });

  it("each tool says when to use it and what the user gets", () => {
    for (const tool of FOCUS_TOOLS) {
      expect(tool.useWhen.length).toBeGreaterThan(0);
      expect(tool.gain.length).toBeGreaterThan(0);
    }
  });
});

describe("28-Day FocusRoute", () => {
  it("lays out the four-week structure with benefits", () => {
    expect(FOCUS_ROUTE_WEEKS.map((w) => w.label)).toEqual([
      "Week 1 — Start easier",
      "Week 2 — Stay with one task",
      "Week 3 — Recover from interruptions",
      "Week 4 — Build your repeatable focus system",
    ]);
    for (const week of FOCUS_ROUTE_WEEKS) {
      expect(week.benefit.length).toBeGreaterThan(0);
    }
  });
});

describe("Your Focus Pattern", () => {
  it("uses practical, non-clinical labels", () => {
    expect(FOCUS_PATTERN.cards.map((c) => c.title)).toEqual([
      "What helps you start",
      "Where focus gets harder",
      "How to get back on track",
      "Best focus conditions",
    ]);
  });
});

describe("Retake the quiz", () => {
  it("is a clean retake entry point with the approved copy", () => {
    expect(RETAKE_QUIZ.title).toBe("Retake the quiz");
    expect(RETAKE_QUIZ.cta).toBe("Retake quiz");
    expect(RETAKE_QUIZ.body).toContain("Retake the quiz anytime to update your plan");
    // reuses the existing quiz flow — no new history feature, no scoring change
    expect(retakeSrc).toContain("startRetake");
  });
});

describe("clinical / script wording removed from the post-purchase dashboard", () => {
  it("no forbidden term appears in any visible dashboard copy", () => {
    const blob = allVisibleCopy().join("\n").toLowerCase();
    for (const term of FORBIDDEN_POST_PURCHASE_TERMS) {
      expect(blob, `forbidden term in copy: ${term}`).not.toContain(term);
    }
  });

  it("the view + retake source contain no clinical/script wording", () => {
    const sources = `${viewSrc}\n${retakeSrc}`.toLowerCase();
    for (const term of FORBIDDEN_POST_PURCHASE_TERMS) {
      expect(sources, `forbidden term in source: ${term}`).not.toContain(term);
    }
    // the specific removed legacy strings are gone
    expect(viewSrc).not.toContain("Cognitive Signature");
    expect(viewSrc).not.toContain("explanation script");
    expect(viewSrc).not.toContain("28-Day Protocol");
  });
});

describe("post-purchase dashboard stays within scope", () => {
  it("does not import billing / Stripe / email / analytics modules", () => {
    const sources = `${viewSrc}\n${retakeSrc}`;
    for (const mod of [
      "@/lib/stripe",
      "@/lib/billing",
      "@/lib/email",
      "@/lib/analytics",
      "@/lib/meta",
    ]) {
      expect(sources, `unexpected import: ${mod}`).not.toContain(mod);
    }
  });
});

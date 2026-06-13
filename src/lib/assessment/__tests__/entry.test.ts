import { describe, expect, it } from "vitest";

import { shouldTrackAssessmentStart } from "../entry";

const fresh = {
  gateReady: true,
  step: "quiz" as const,
  currentQuestionIndex: 0,
  retakeMode: false,
  alreadyTracked: false,
};

describe("shouldTrackAssessmentStart", () => {
  it("fires once for a fresh organic/paid entry on Q1", () => {
    expect(shouldTrackAssessmentStart(fresh)).toBe(true);
  });

  it("never re-fires once already tracked (no double assessment_started / paid_auto_started)", () => {
    expect(shouldTrackAssessmentStart({ ...fresh, alreadyTracked: true })).toBe(false);
  });

  it("waits for the payment gate: does not fire while still checking/verifying", () => {
    expect(shouldTrackAssessmentStart({ ...fresh, gateReady: false })).toBe(false);
  });

  it("does not fire when resuming a later question", () => {
    expect(shouldTrackAssessmentStart({ ...fresh, currentQuestionIndex: 5 })).toBe(false);
  });

  it("does not fire for a retake re-entering at Q1", () => {
    expect(shouldTrackAssessmentStart({ ...fresh, retakeMode: true })).toBe(false);
  });

  it("does not fire on a post-purchase / non-quiz step", () => {
    for (const step of ["loading", "email", "chart", "paywall", "upsell", "subscription", "success"] as const) {
      expect(shouldTrackAssessmentStart({ ...fresh, step })).toBe(false);
    }
  });
});

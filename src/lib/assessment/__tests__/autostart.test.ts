import { describe, expect, it } from "vitest";

import { shouldAutoStartAssessment } from "../autostart";

describe("shouldAutoStartAssessment", () => {
  it("auto-starts for Meta paid assessment traffic", () => {
    const params = new URLSearchParams(
      "?utm_source=meta&utm_medium=paid_social&utm_campaign=sales_broad_us_starting_problem&utm_content=c4_starting_hook1_video&utm_term=broad_starting",
    );

    expect(shouldAutoStartAssessment(params)).toBe(true);
  });

  it("keeps direct and organic assessment traffic on the landing", () => {
    expect(shouldAutoStartAssessment(new URLSearchParams(""))).toBe(false);
    expect(shouldAutoStartAssessment({ utm_source: "newsletter" })).toBe(false);
    expect(shouldAutoStartAssessment({ utm_medium: "organic_social" })).toBe(false);
  });

  it("auto-starts for recognized paid campaign intent", () => {
    expect(shouldAutoStartAssessment({ utm_campaign: "spring_retargeting_us" })).toBe(true);
    expect(shouldAutoStartAssessment({ utm_campaign: "sales_broad_us_starting_problem" })).toBe(true);
  });

  it("supports explicit future start flags", () => {
    expect(shouldAutoStartAssessment({ start: "quiz" })).toBe(true);
    expect(shouldAutoStartAssessment({ auto_start: "1" })).toBe(true);
    expect(shouldAutoStartAssessment({ auto_start: "true" })).toBe(true);
  });
});

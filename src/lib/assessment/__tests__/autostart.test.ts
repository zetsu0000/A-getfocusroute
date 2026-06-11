import { describe, expect, it } from "vitest";

import {
  isPaidAssessmentTraffic,
  paidHomepageRedirectPath,
  shouldAutoStartAssessment,
} from "../autostart";

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

describe("isPaidAssessmentTraffic", () => {
  it("classifies paid assessment UTM traffic", () => {
    expect(isPaidAssessmentTraffic({ utm_source: "meta" })).toBe(true);
    expect(isPaidAssessmentTraffic({ utm_medium: "paid_social" })).toBe(true);
    expect(isPaidAssessmentTraffic({ utm_campaign: "sales_broad_us_starting_problem" })).toBe(true);
  });

  it("does not classify explicit start flags or organic traffic as paid", () => {
    expect(isPaidAssessmentTraffic({ start: "quiz" })).toBe(false);
    expect(isPaidAssessmentTraffic({ auto_start: "true" })).toBe(false);
    expect(isPaidAssessmentTraffic({ utm_source: "newsletter" })).toBe(false);
    expect(isPaidAssessmentTraffic(new URLSearchParams(""))).toBe(false);
  });
});

describe("paidHomepageRedirectPath", () => {
  it("routes paid Meta homepage traffic to /assessment with the full query preserved", () => {
    const query =
      "utm_source=meta&utm_medium=paid_social&utm_campaign=sales_broad_us_starting_problem&utm_content=c4_starting_hook1_video&utm_term=broad_starting&fbclid=abc123";

    expect(paidHomepageRedirectPath("/", new URLSearchParams(query))).toBe(
      `/assessment?${query}`,
    );
  });

  it("routes paid campaign-intent homepage traffic", () => {
    expect(
      paidHomepageRedirectPath("/", new URLSearchParams("utm_campaign=spring_retargeting_us")),
    ).toBe("/assessment?utm_campaign=spring_retargeting_us");
  });

  it("leaves organic and direct homepage traffic alone", () => {
    expect(paidHomepageRedirectPath("/", new URLSearchParams(""))).toBeNull();
    expect(
      paidHomepageRedirectPath("/", new URLSearchParams("utm_source=newsletter")),
    ).toBeNull();
    expect(
      paidHomepageRedirectPath("/", new URLSearchParams("utm_medium=organic_social")),
    ).toBeNull();
  });

  it("never redirects routes other than the homepage", () => {
    expect(
      paidHomepageRedirectPath("/assessment", new URLSearchParams("utm_source=meta")),
    ).toBeNull();
    expect(
      paidHomepageRedirectPath("/about", new URLSearchParams("utm_source=meta")),
    ).toBeNull();
  });
});

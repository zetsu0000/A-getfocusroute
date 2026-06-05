import { describe, it, expect } from "vitest";

import {
  ATTRIBUTION_PARAM_KEYS,
  extractAttributionParams,
  hasAttributionParams,
  captureAttribution,
  getAttributionForAnalytics,
} from "../attribution";

describe("extractAttributionParams", () => {
  it("captures all supported utm and click-id params", () => {
    const search =
      "?utm_source=fb&utm_medium=cpc&utm_campaign=launch&utm_content=ad1&utm_term=focus&fbclid=FB&gclid=GG&ttclid=TT&msclkid=MS";
    const out = extractAttributionParams(search);
    expect(out).toEqual({
      utm_source: "fb",
      utm_medium: "cpc",
      utm_campaign: "launch",
      utm_content: "ad1",
      utm_term: "focus",
      fbclid: "FB",
      gclid: "GG",
      ttclid: "TT",
      msclkid: "MS",
    });
    expect(Object.keys(out).length).toBe(ATTRIBUTION_PARAM_KEYS.length);
  });

  it("ignores unrelated and empty params", () => {
    const out = extractAttributionParams("?ref=hn&utm_source=&utm_medium=email");
    expect(out).toEqual({ utm_medium: "email" });
  });

  it("trims and truncates very long values", () => {
    const long = "x".repeat(500);
    const out = extractAttributionParams(`?utm_campaign=${long}`);
    expect(out.utm_campaign?.length).toBe(300);
  });
});

describe("hasAttributionParams", () => {
  it("is true when any tracking param exists", () => {
    expect(hasAttributionParams({ gclid: "abc" })).toBe(true);
  });
  it("is false for an empty object", () => {
    expect(hasAttributionParams({})).toBe(false);
  });
});

describe("SSR safety", () => {
  it("captureAttribution returns empty touches without window", () => {
    expect(captureAttribution()).toEqual({ first: null, last: null });
  });
  it("getAttributionForAnalytics returns an empty object without window", () => {
    expect(getAttributionForAnalytics()).toEqual({});
  });
});

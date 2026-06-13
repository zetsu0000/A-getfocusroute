import { describe, expect, it } from "vitest";

import { classifyMalformedBackslashPath } from "../malformed-path";

describe("classifyMalformedBackslashPath", () => {
  it("allows normal public paths", () => {
    for (const pathname of ["/", "/login", "/assessment", "/dashboard", "/api/verify-payment"]) {
      expect(classifyMalformedBackslashPath(pathname)).toEqual({ action: "allow" });
    }
  });

  it("redirects uppercase and lowercase trailing encoded backslashes", () => {
    expect(classifyMalformedBackslashPath("/login%5C")).toEqual({
      action: "redirect",
      pathname: "/login",
    });
    expect(classifyMalformedBackslashPath("/login%5c")).toEqual({
      action: "redirect",
      pathname: "/login",
    });
  });

  it("redirects multiple trailing backslashes without repeatedly decoding", () => {
    expect(classifyMalformedBackslashPath("/assessment%5C%5c\\")).toEqual({
      action: "redirect",
      pathname: "/assessment",
    });
    expect(classifyMalformedBackslashPath("/foo%255C%5C")).toEqual({
      action: "redirect",
      pathname: "/foo%255C",
    });
  });

  it("rejects interior encoded and raw backslashes", () => {
    for (const pathname of [
      "/foo%5Cbar",
      "/login%5Cadmin",
      "/foo\\bar",
      "/foo%5Cbar%5C",
    ]) {
      expect(classifyMalformedBackslashPath(pathname)).toEqual({ action: "reject" });
    }
  });

  it("rejects malformed API paths instead of rewriting them", () => {
    expect(classifyMalformedBackslashPath("/api%5Cverify-payment")).toEqual({
      action: "reject",
    });
    expect(classifyMalformedBackslashPath("/api/create-subscription%5Cunexpected")).toEqual({
      action: "reject",
    });
  });

  it("does not treat other encodings as backslashes", () => {
    expect(classifyMalformedBackslashPath("/foo%2Fbar")).toEqual({ action: "allow" });
    expect(classifyMalformedBackslashPath("/foo%2E%2Ebar")).toEqual({ action: "allow" });
    expect(classifyMalformedBackslashPath("/foo%255Cbar")).toEqual({ action: "allow" });
  });
});

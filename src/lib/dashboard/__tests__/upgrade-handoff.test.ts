import { describe, expect, it } from "vitest";

import {
  decideUpgradeHandoff,
  isUpgradeNeed,
  parseUpgradeHandoffResponse,
  readUpgradeNeed,
  resolveUpgradeNeedTarget,
  stepForUpgradeNeed,
  type UpgradeHandoffContext,
} from "../upgrade-handoff";
import type { EntitlementKey } from "@/lib/access/entitlements";
import {
  gateFunnelEntry,
  planFunnelEntry,
  stripFunnelEntryParams,
} from "@/lib/payment-verification";
import type { QuizAnswer } from "@/types/quiz";

const ANSWERS: QuizAnswer[] = [
  { questionId: "q1", selectedOptions: ["a"] },
  { questionId: "q2", selectedOptions: ["b", "c"] },
];

function entitlements(...keys: EntitlementKey[]): Set<EntitlementKey> {
  return new Set(keys);
}

function ctx(overrides: Partial<UpgradeHandoffContext> = {}): UpgradeHandoffContext {
  return {
    user: { id: "user-1", email: "buyer@example.com" },
    quizRow: { id: "row-1", email: "buyer@example.com", name: "Sam" },
    quizAnswers: ANSWERS,
    entitlementSet: entitlements(),
    ...overrides,
  };
}

describe("public funnel protection is unchanged", () => {
  it("still denies a direct public ?step=paywall (handoff does not relax the gate)", () => {
    expect(gateFunnelEntry("paywall", "quiz", false)).toBe("deny");
    expect(planFunnelEntry("?step=paywall", "quiz")).toEqual({ kind: "ignore" });
  });

  it("treats ?upgrade= as a separate channel the public gate ignores", () => {
    // The dashboard handoff param never advances the public gate by itself.
    expect(planFunnelEntry("?upgrade=brain_profile", "quiz")).toEqual({
      kind: "ready",
    });
  });

  it("strips the upgrade param on cleanup while preserving UTMs", () => {
    expect(stripFunnelEntryParams("?upgrade=brain_profile")).toBe("");
    expect(
      stripFunnelEntryParams("?upgrade=membership&utm_source=fb"),
    ).toBe("?utm_source=fb");
  });
});

describe("need parsing and step mapping", () => {
  it("accepts only known upgrade needs", () => {
    expect(isUpgradeNeed("brain_profile")).toBe(true);
    expect(isUpgradeNeed("roadmap_28_day")).toBe(true);
    expect(isUpgradeNeed("bonus_toolkit")).toBe(true);
    expect(isUpgradeNeed("membership")).toBe(true);
    expect(isUpgradeNeed("success")).toBe(false);
    expect(isUpgradeNeed("")).toBe(false);
    expect(isUpgradeNeed(null)).toBe(false);
    expect(isUpgradeNeed("brain_profile; DROP TABLE")).toBe(false);
  });

  it("reads the handoff need from the ?upgrade= query", () => {
    expect(readUpgradeNeed("?upgrade=brain_profile")).toBe("brain_profile");
    expect(readUpgradeNeed("?upgrade=membership&utm_source=x")).toBe("membership");
    expect(readUpgradeNeed("?step=paywall")).toBeNull();
    expect(readUpgradeNeed("?upgrade=bogus")).toBeNull();
    expect(readUpgradeNeed("")).toBeNull();
  });

  it("keeps the raw need-to-step mapping stable", () => {
    expect(stepForUpgradeNeed("brain_profile")).toBe("paywall");
    expect(stepForUpgradeNeed("roadmap_28_day")).toBe("upsell");
    expect(stepForUpgradeNeed("bonus_toolkit")).toBe("upsell");
    expect(stepForUpgradeNeed("membership")).toBe("subscription");
  });

  it("resolves each need to the currently purchasable offer from entitlements", () => {
    expect(resolveUpgradeNeedTarget("brain_profile", entitlements())).toEqual({
      kind: "purchase",
      need: "brain_profile",
      step: "paywall",
    });
    expect(resolveUpgradeNeedTarget("roadmap_28_day", entitlements())).toEqual({
      kind: "purchase",
      need: "brain_profile",
      step: "paywall",
    });
    expect(
      resolveUpgradeNeedTarget(
        "roadmap_28_day",
        entitlements("brain_profile"),
      ),
    ).toEqual({
      kind: "purchase",
      need: "roadmap_28_day",
      step: "upsell",
    });
    expect(
      resolveUpgradeNeedTarget("membership", entitlements("brain_profile")),
    ).toEqual({
      kind: "purchase",
      need: "roadmap_28_day",
      step: "upsell",
    });
    expect(
      resolveUpgradeNeedTarget("membership", entitlements("roadmap_28_day")),
    ).toEqual({
      kind: "purchase",
      need: "membership",
      step: "subscription",
    });
    expect(
      resolveUpgradeNeedTarget(
        "bonus_toolkit",
        entitlements("brain_profile"),
      ),
    ).toEqual({
      kind: "purchase",
      need: "roadmap_28_day",
      step: "upsell",
    });
    expect(
      resolveUpgradeNeedTarget("bonus_toolkit", entitlements("roadmap_28_day")),
    ).toEqual({
      kind: "dashboard",
      href: "/dashboard/bonuses",
      cta: "View Bonuses",
    });
    expect(
      resolveUpgradeNeedTarget("bonus_toolkit", entitlements("bonus_toolkit")),
    ).toEqual({
      kind: "dashboard",
      href: "/dashboard/bonuses",
      cta: "View Bonuses",
    });
  });
});

describe("decideUpgradeHandoff", () => {
  it("authorizes the Brain Profile CTA and reaches the paywall (never Q1)", () => {
    expect(decideUpgradeHandoff("brain_profile", ctx())).toEqual({
      authorized: true,
      step: "paywall",
      email: "buyer@example.com",
      name: "Sam",
      quizResultId: "row-1",
      answers: ANSWERS,
    });
  });

  it("routes later needs to the prerequisite offer until entitlements are earned", () => {
    expect(decideUpgradeHandoff("roadmap_28_day", ctx())).toMatchObject({
      authorized: true,
      step: "paywall",
    });
    expect(decideUpgradeHandoff("bonus_toolkit", ctx())).toMatchObject({
      authorized: true,
      step: "paywall",
    });
    expect(decideUpgradeHandoff("membership", ctx())).toMatchObject({
      authorized: true,
      step: "paywall",
    });
  });

  it("opens roadmap only after Brain Profile access exists", () => {
    expect(
      decideUpgradeHandoff(
        "roadmap_28_day",
        ctx({ entitlementSet: entitlements("brain_profile") }),
      ),
    ).toMatchObject({
      authorized: true,
      step: "upsell",
    });
  });

  it("opens membership only after Roadmap access exists", () => {
    expect(
      decideUpgradeHandoff(
        "membership",
        ctx({ entitlementSet: entitlements("brain_profile") }),
      ),
    ).toMatchObject({
      authorized: true,
      step: "upsell",
    });
    expect(
      decideUpgradeHandoff(
        "membership",
        ctx({ entitlementSet: entitlements("roadmap_28_day") }),
      ),
    ).toMatchObject({
      authorized: true,
      step: "subscription",
    });
  });

  it("does not sell Bonus Toolkit standalone", () => {
    expect(
      decideUpgradeHandoff(
        "bonus_toolkit",
        ctx({ entitlementSet: entitlements("brain_profile") }),
      ),
    ).toMatchObject({
      authorized: true,
      step: "upsell",
    });
    expect(
      decideUpgradeHandoff(
        "bonus_toolkit",
        ctx({ entitlementSet: entitlements("roadmap_28_day") }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/bonuses",
      cta: "View Bonuses",
    });
  });

  it("does not offer already-owned products again", () => {
    expect(
      decideUpgradeHandoff(
        "brain_profile",
        ctx({ entitlementSet: entitlements("brain_profile") }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/profile",
      cta: "Open Brain Profile",
    });
    expect(
      decideUpgradeHandoff(
        "roadmap_28_day",
        ctx({ entitlementSet: entitlements("roadmap_28_day") }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/roadmap",
      cta: "Open 28-Day Protocol",
    });
  });

  it("routes already-owned products to dashboard pages before requiring assessment data", () => {
    const noAssessment = { quizRow: null, quizAnswers: [] };

    expect(
      decideUpgradeHandoff(
        "brain_profile",
        ctx({
          ...noAssessment,
          entitlementSet: entitlements("brain_profile"),
        }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/profile",
      cta: "Open Brain Profile",
    });
    expect(
      decideUpgradeHandoff(
        "roadmap_28_day",
        ctx({
          ...noAssessment,
          entitlementSet: entitlements("roadmap_28_day"),
        }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/roadmap",
      cta: "Open 28-Day Protocol",
    });
    expect(
      decideUpgradeHandoff(
        "bonus_toolkit",
        ctx({
          ...noAssessment,
          entitlementSet: entitlements("roadmap_28_day"),
        }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/bonuses",
      cta: "View Bonuses",
    });
    expect(
      decideUpgradeHandoff(
        "membership",
        ctx({
          ...noAssessment,
          entitlementSet: entitlements("membership"),
        }),
      ),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/membership",
      cta: "Open Membership",
    });
  });

  it("works from verified server context alone (fresh tab / no sessionStorage)", () => {
    // The decision depends only on the server-provided user + saved assessment,
    // so a brand-new tab with empty client state still reaches the right step.
    const decision = decideUpgradeHandoff("brain_profile", ctx());
    expect(decision.authorized).toBe(true);
  });

  it("denies an unknown or manipulated need", () => {
    expect(decideUpgradeHandoff("success", ctx())).toEqual({
      authorized: false,
      reason: "invalid_request",
    });
    expect(decideUpgradeHandoff("paywall", ctx())).toEqual({
      authorized: false,
      reason: "invalid_request",
    });
    expect(decideUpgradeHandoff(null, ctx())).toEqual({
      authorized: false,
      reason: "invalid_request",
    });
  });

  it("denies login alone — a query parameter without a session is rejected", () => {
    expect(decideUpgradeHandoff("brain_profile", ctx({ user: null }))).toEqual({
      authorized: false,
      reason: "unauthenticated",
    });
  });

  it("requires a completed assessment, else honest assessment-required recovery", () => {
    expect(
      decideUpgradeHandoff("brain_profile", ctx({ quizRow: null, quizAnswers: [] })),
    ).toEqual({ authorized: false, reason: "no_assessment" });
    // A row with no usable answers is treated the same as none.
    expect(
      decideUpgradeHandoff(
        "brain_profile",
        ctx({ quizRow: { id: "row-1" }, quizAnswers: [] }),
      ),
    ).toEqual({ authorized: false, reason: "no_assessment" });
  });

  it("falls back to the session email when the saved row has none", () => {
    const decision = decideUpgradeHandoff(
      "brain_profile",
      ctx({ quizRow: { id: "row-1", name: "" } }),
    );
    expect(decision).toMatchObject({
      authorized: true,
      email: "buyer@example.com",
      name: "",
      quizResultId: "row-1",
    });
  });
});

describe("parseUpgradeHandoffResponse", () => {
  it("accepts a well-formed authorized response", () => {
    expect(
      parseUpgradeHandoffResponse({
        authorized: true,
        step: "paywall",
        email: "buyer@example.com",
        name: "Sam",
        quizResultId: "row-1",
        answers: ANSWERS,
      }),
    ).toEqual({
      authorized: true,
      step: "paywall",
      email: "buyer@example.com",
      name: "Sam",
      quizResultId: "row-1",
      answers: ANSWERS,
    });
  });

  it("passes through explicit denial reasons", () => {
    expect(
      parseUpgradeHandoffResponse({ authorized: false, reason: "no_assessment" }),
    ).toEqual({ authorized: false, reason: "no_assessment" });
    expect(
      parseUpgradeHandoffResponse({ authorized: false, reason: "unauthenticated" }),
    ).toEqual({ authorized: false, reason: "unauthenticated" });
    expect(
      parseUpgradeHandoffResponse({
        authorized: false,
        reason: "already_unlocked",
        redirectTo: "/dashboard/bonuses",
        cta: "View Bonuses",
      }),
    ).toEqual({
      authorized: false,
      reason: "already_unlocked",
      redirectTo: "/dashboard/bonuses",
      cta: "View Bonuses",
    });
  });

  it("treats malformed or manipulated responses as a recoverable denial", () => {
    expect(parseUpgradeHandoffResponse(null)).toEqual({
      authorized: false,
      reason: "error",
    });
    expect(parseUpgradeHandoffResponse("nope")).toEqual({
      authorized: false,
      reason: "error",
    });
    // authorized:true but a non-handoff or forged step must not open anything —
    // not even a real funnel step like "success" that the handoff never issues.
    expect(
      parseUpgradeHandoffResponse({ authorized: true, step: "success" }),
    ).toEqual({ authorized: false, reason: "error" });
    expect(
      parseUpgradeHandoffResponse({ authorized: true, step: "quiz" }),
    ).toEqual({ authorized: false, reason: "error" });
    expect(
      parseUpgradeHandoffResponse({ authorized: true, step: "not_a_step" }),
    ).toEqual({ authorized: false, reason: "error" });
    expect(
      parseUpgradeHandoffResponse({
        authorized: false,
        reason: "already_unlocked",
        redirectTo: "https://example.com",
      }),
    ).toEqual({ authorized: false, reason: "already_unlocked" });
  });
});

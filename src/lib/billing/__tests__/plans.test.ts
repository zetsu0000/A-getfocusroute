import { describe, it, expect } from "vitest";

import {
  PLAN_KEYS,
  PLAN_LIST,
  PLANS,
  DEFAULT_PLAN_KEY,
  isPlanKey,
  introPerDayCents,
  formatMoney,
  renewalSuffix,
  renewalCadenceLabel,
  introWindowLabel,
} from "../plans";

// ── Catalogue shape ───────────────────────────────────────────────────────────

describe("plan catalogue", () => {
  it("lists the three plans in display order", () => {
    expect(PLAN_LIST.map((p) => p.key)).toEqual([
      "plan_1week",
      "plan_4week",
      "plan_12week",
    ]);
  });

  it("defaults to the 4-Week plan and it is the only Most Popular", () => {
    expect(DEFAULT_PLAN_KEY).toBe("plan_4week");
    expect(PLANS[DEFAULT_PLAN_KEY].popular).toBe(true);
    expect(PLAN_LIST.filter((p) => p.popular)).toHaveLength(1);
  });

  it("matches the contracted intro -> renewal pricing exactly", () => {
    // [introAmount, introDays, renewalAmount, renewalInterval]
    expect([
      PLANS.plan_1week.introAmount,
      PLANS.plan_1week.introDays,
      PLANS.plan_1week.renewalAmount,
      PLANS.plan_1week.renewalInterval,
    ]).toEqual([1050, 7, 4350, "month"]);

    expect([
      PLANS.plan_4week.introAmount,
      PLANS.plan_4week.introDays,
      PLANS.plan_4week.renewalAmount,
      PLANS.plan_4week.renewalInterval,
    ]).toEqual([1999, 28, 4350, "month"]);

    expect([
      PLANS.plan_12week.introAmount,
      PLANS.plan_12week.introDays,
      PLANS.plan_12week.renewalAmount,
      PLANS.plan_12week.renewalInterval,
    ]).toEqual([3499, 84, 8999, "quarter"]);
  });

  it("all intro windows are whole weeks (required by the schedule duration)", () => {
    for (const p of PLAN_LIST) {
      expect(p.introDays % 7).toBe(0);
    }
  });
});

// ── isPlanKey ─────────────────────────────────────────────────────────────────

describe("isPlanKey", () => {
  it("accepts the three valid keys", () => {
    for (const k of PLAN_KEYS) expect(isPlanKey(k)).toBe(true);
  });

  it("rejects unknown / wrong-type values", () => {
    expect(isPlanKey("membership_monthly")).toBe(false);
    expect(isPlanKey("plan_2week")).toBe(false);
    expect(isPlanKey("")).toBe(false);
    expect(isPlanKey(null)).toBe(false);
    expect(isPlanKey(undefined)).toBe(false);
    expect(isPlanKey(4)).toBe(false);
  });
});

// ── Per-day math (the prominent value cue) ────────────────────────────────────

describe("introPerDayCents", () => {
  it("computes the contracted per-day price", () => {
    expect(introPerDayCents(PLANS.plan_1week)).toBe(150); // $1.50
    expect(introPerDayCents(PLANS.plan_4week)).toBe(71); //  $0.71
    expect(introPerDayCents(PLANS.plan_12week)).toBe(42); // $0.42
  });
});

// ── Formatting ────────────────────────────────────────────────────────────────

describe("formatMoney", () => {
  it("always renders two decimals", () => {
    expect(formatMoney(1050)).toBe("$10.50");
    expect(formatMoney(4350)).toBe("$43.50");
    expect(formatMoney(8999)).toBe("$89.99");
    expect(formatMoney(42)).toBe("$0.42");
  });
});

describe("renewal labels", () => {
  it("renders the right suffix", () => {
    expect(renewalSuffix(PLANS.plan_4week)).toBe("/mo");
    expect(renewalSuffix(PLANS.plan_12week)).toBe("/3 mo");
  });

  it("renders the right cadence label", () => {
    expect(renewalCadenceLabel(PLANS.plan_4week)).toBe("month");
    expect(renewalCadenceLabel(PLANS.plan_12week)).toBe("3 months");
  });
});

describe("introWindowLabel", () => {
  it("phrases the intro window for disclosure copy", () => {
    expect(introWindowLabel(PLANS.plan_1week)).toBe("7 days");
    expect(introWindowLabel(PLANS.plan_4week)).toBe("4 weeks");
    expect(introWindowLabel(PLANS.plan_12week)).toBe("12 weeks");
  });
});

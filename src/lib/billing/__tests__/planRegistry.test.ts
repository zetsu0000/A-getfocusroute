import { describe, it, expect } from "vitest";

import {
  resolvePlanPrices,
  planKeyForPriceId,
  planProductKeyForPriceId,
  planKeyToProductKey,
} from "../planRegistry";
import {
  resolvePriceIdToProductKey,
  resolveMembershipProductKey,
} from "@/lib/stripe/productKeyPolicy";

// ── helpers ──────────────────────────────────────────────────────────────────

function withEnv(vars: Record<string, string>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k] of Object.entries(vars)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// ── fixtures ─────────────────────────────────────────────────────────────────

const ID = {
  oneWkIntro: "price_1week_intro",
  oneWkRenew: "price_1week_renewal",
  fourWkIntro: "price_4week_intro",
  fourWkRenew: "price_4week_renewal",
  twelveWkIntro: "price_12week_intro",
  twelveWkRenew: "price_12week_renewal",
  unknown: "price_UNKNOWN_000",
};

const PLAN_ENV: Record<string, string> = {
  STRIPE_PRICE_PLAN_1WEEK_INTRO: ID.oneWkIntro,
  STRIPE_PRICE_PLAN_1WEEK_RENEWAL: ID.oneWkRenew,
  STRIPE_PRICE_PLAN_4WEEK_INTRO: ID.fourWkIntro,
  STRIPE_PRICE_PLAN_4WEEK_RENEWAL: ID.fourWkRenew,
  STRIPE_PRICE_PLAN_12WEEK_INTRO: ID.twelveWkIntro,
  STRIPE_PRICE_PLAN_12WEEK_RENEWAL: ID.twelveWkRenew,
};

const UNSET_ENV: Record<string, string> = Object.fromEntries(
  Object.keys(PLAN_ENV).map((k) => [k, ""]),
);

// ── planKeyToProductKey ───────────────────────────────────────────────────────

describe("planKeyToProductKey", () => {
  it("maps each plan to its membership product key", () => {
    expect(planKeyToProductKey("plan_1week")).toBe("membership_1week");
    expect(planKeyToProductKey("plan_4week")).toBe("membership_4week");
    expect(planKeyToProductKey("plan_12week")).toBe("membership_12week");
  });
});

// ── resolvePlanPrices (fail-closed) ───────────────────────────────────────────

describe("resolvePlanPrices", () => {
  it("returns both price IDs when fully configured", () => {
    withEnv(PLAN_ENV, () => {
      expect(resolvePlanPrices("plan_4week")).toEqual({
        introPriceId: ID.fourWkIntro,
        renewalPriceId: ID.fourWkRenew,
      });
    });
  });

  it("fails closed (null) when neither price is configured", () => {
    withEnv(UNSET_ENV, () => {
      expect(resolvePlanPrices("plan_4week")).toBeNull();
    });
  });

  it("fails closed when only the intro price is configured", () => {
    withEnv({ ...UNSET_ENV, STRIPE_PRICE_PLAN_4WEEK_INTRO: ID.fourWkIntro }, () => {
      expect(resolvePlanPrices("plan_4week")).toBeNull();
    });
  });

  it("fails closed when only the renewal price is configured", () => {
    withEnv({ ...UNSET_ENV, STRIPE_PRICE_PLAN_4WEEK_RENEWAL: ID.fourWkRenew }, () => {
      expect(resolvePlanPrices("plan_4week")).toBeNull();
    });
  });

  it("trims whitespace around configured IDs", () => {
    withEnv(
      {
        STRIPE_PRICE_PLAN_1WEEK_INTRO: `  ${ID.oneWkIntro}  `,
        STRIPE_PRICE_PLAN_1WEEK_RENEWAL: `\t${ID.oneWkRenew}\n`,
      },
      () => {
        expect(resolvePlanPrices("plan_1week")).toEqual({
          introPriceId: ID.oneWkIntro,
          renewalPriceId: ID.oneWkRenew,
        });
      },
    );
  });
});

// ── planKeyForPriceId — intro AND renewal both map back ───────────────────────

describe("planKeyForPriceId", () => {
  it("resolves both the intro and renewal price of each plan", () => {
    withEnv(PLAN_ENV, () => {
      expect(planKeyForPriceId(ID.oneWkIntro)).toBe("plan_1week");
      expect(planKeyForPriceId(ID.oneWkRenew)).toBe("plan_1week");
      expect(planKeyForPriceId(ID.fourWkIntro)).toBe("plan_4week");
      expect(planKeyForPriceId(ID.fourWkRenew)).toBe("plan_4week");
      expect(planKeyForPriceId(ID.twelveWkIntro)).toBe("plan_12week");
      expect(planKeyForPriceId(ID.twelveWkRenew)).toBe("plan_12week");
    });
  });

  it("returns null for unknown / empty / nullish input", () => {
    withEnv(PLAN_ENV, () => {
      expect(planKeyForPriceId(ID.unknown)).toBeNull();
      expect(planKeyForPriceId("")).toBeNull();
      expect(planKeyForPriceId(null)).toBeNull();
      expect(planKeyForPriceId(undefined)).toBeNull();
    });
  });

  it("does not match an empty configured slot (no false positive on '')", () => {
    withEnv(UNSET_ENV, () => {
      expect(planKeyForPriceId("")).toBeNull();
      expect(planKeyForPriceId(ID.fourWkIntro)).toBeNull();
    });
  });
});

// ── planProductKeyForPriceId ──────────────────────────────────────────────────

describe("planProductKeyForPriceId", () => {
  it("maps intro and renewal prices to the membership product key", () => {
    withEnv(PLAN_ENV, () => {
      expect(planProductKeyForPriceId(ID.twelveWkIntro)).toBe("membership_12week");
      expect(planProductKeyForPriceId(ID.twelveWkRenew)).toBe("membership_12week");
    });
  });

  it("returns null for unknown price IDs", () => {
    withEnv(PLAN_ENV, () => {
      expect(planProductKeyForPriceId(ID.unknown)).toBeNull();
    });
  });
});

// ── integration with productKeyPolicy (webhook access path) ───────────────────

describe("productKeyPolicy resolves plan prices end-to-end", () => {
  it("resolves both intro and renewal IDs to the membership product key", () => {
    withEnv(PLAN_ENV, () => {
      // Renewal resolves through the priceEnvMap; intro resolves through the
      // plan registry fallback — both must yield the same membership key so the
      // webhook grants access during both phases.
      expect(resolvePriceIdToProductKey(ID.fourWkRenew)).toBe("membership_4week");
      expect(resolvePriceIdToProductKey(ID.fourWkIntro)).toBe("membership_4week");
    });
  });

  it("treats plan prices as membership (not one-time) products", () => {
    withEnv(PLAN_ENV, () => {
      expect(resolveMembershipProductKey(ID.oneWkIntro)).toBe("membership_1week");
      expect(resolveMembershipProductKey(ID.oneWkRenew)).toBe("membership_1week");
    });
  });
});

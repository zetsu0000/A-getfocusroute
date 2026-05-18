import { describe, it, expect } from "vitest";

import {
  resolvePriceIdToProductKey,
  resolveOneTimeProductKey,
  resolveMembershipProductKey,
  paymentIntentProductKeyMatchesPolicy,
} from "../productKeyPolicy";

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

const P = {
  brainProfile:      "price_1TYF7sLqKfCkbv0vKvmuXHFv",
  roadmap28Day:      "price_1TYF81LqKfCkbv0vhoXnDltZ",
  membershipMonthly: "price_1TYF8gLqKfCkbv0vHmj73P2s",
  membershipAnnual:  "price_1TYF8tLqKfCkbv0viiVboOdW",
  unknown:           "price_UNKNOWN_000",
};

const SERVER_ENV: Record<string, string> = {
  STRIPE_PRICE_BRAIN_PROFILE:      P.brainProfile,
  STRIPE_PRICE_ROADMAP_28_DAY:     P.roadmap28Day,
  STRIPE_PRICE_MEMBERSHIP_MONTHLY: P.membershipMonthly,
  STRIPE_PRICE_MEMBERSHIP_ANNUAL:  P.membershipAnnual,
};

const PUBLIC_ENV: Record<string, string> = {
  NEXT_PUBLIC_PRICE_ASSESSMENT: P.brainProfile,
  NEXT_PUBLIC_PRICE_ROADMAP:    P.roadmap28Day,
  NEXT_PUBLIC_PRICE_MONTHLY:    P.membershipMonthly,
  NEXT_PUBLIC_PRICE_ANNUAL:     P.membershipAnnual,
};

// ── resolvePriceIdToProductKey ────────────────────────────────────────────────

describe("resolvePriceIdToProductKey", () => {
  it("returns null for empty string", () => {
    expect(resolvePriceIdToProductKey("")).toBeNull();
  });

  it("returns null for unknown price ID", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolvePriceIdToProductKey(P.unknown)).toBeNull();
    });
  });

  it("resolves brain_profile via STRIPE_PRICE_BRAIN_PROFILE", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolvePriceIdToProductKey(P.brainProfile)).toBe("brain_profile");
    });
  });

  it("resolves roadmap_28_day via STRIPE_PRICE_ROADMAP_28_DAY", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolvePriceIdToProductKey(P.roadmap28Day)).toBe("roadmap_28_day");
    });
  });

  it("resolves membership_monthly via STRIPE_PRICE_MEMBERSHIP_MONTHLY", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolvePriceIdToProductKey(P.membershipMonthly)).toBe("membership_monthly");
    });
  });

  it("resolves membership_annual via STRIPE_PRICE_MEMBERSHIP_ANNUAL", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolvePriceIdToProductKey(P.membershipAnnual)).toBe("membership_annual");
    });
  });

  it("falls back to NEXT_PUBLIC vars when STRIPE_PRICE vars are absent", () => {
    withEnv(PUBLIC_ENV, () => {
      expect(resolvePriceIdToProductKey(P.brainProfile)).toBe("brain_profile");
    });
  });

  it("falls back NEXT_PUBLIC_PRICE_ROADMAP correctly", () => {
    withEnv(PUBLIC_ENV, () => {
      expect(resolvePriceIdToProductKey(P.roadmap28Day)).toBe("roadmap_28_day");
    });
  });

  it("trims whitespace from env var values", () => {
    withEnv({ STRIPE_PRICE_BRAIN_PROFILE: `  ${P.brainProfile}  ` }, () => {
      expect(resolvePriceIdToProductKey(P.brainProfile)).toBe("brain_profile");
    });
  });
});

// ── resolveOneTimeProductKey ──────────────────────────────────────────────────

describe("resolveOneTimeProductKey", () => {
  it("returns brain_profile for paywall price ID", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveOneTimeProductKey(P.brainProfile, "paywall")).toBe("brain_profile");
    });
  });

  it("returns roadmap_28_day for upsell price ID", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveOneTimeProductKey(P.roadmap28Day, "upsell")).toBe("roadmap_28_day");
    });
  });

  it("returns null for membership price (not a one-time product)", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveOneTimeProductKey(P.membershipMonthly, "subscription")).toBeNull();
    });
  });

  it("returns null for unknown price ID", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveOneTimeProductKey(P.unknown, "paywall")).toBeNull();
    });
  });
});

// ── resolveMembershipProductKey ───────────────────────────────────────────────

describe("resolveMembershipProductKey", () => {
  it("returns membership_monthly", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveMembershipProductKey(P.membershipMonthly)).toBe("membership_monthly");
    });
  });

  it("returns membership_annual", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveMembershipProductKey(P.membershipAnnual)).toBe("membership_annual");
    });
  });

  it("returns null for one-time product price", () => {
    withEnv(SERVER_ENV, () => {
      expect(resolveMembershipProductKey(P.brainProfile)).toBeNull();
    });
  });
});

// ── paymentIntentProductKeyMatchesPolicy ──────────────────────────────────────

describe("paymentIntentProductKeyMatchesPolicy", () => {
  it("returns true when both priceId and funnel_step are absent (cannot validate)", () => {
    expect(paymentIntentProductKeyMatchesPolicy({}, "brain_profile")).toBe(true);
  });

  it("returns true when only priceId is present (funnel_step missing)", () => {
    expect(
      paymentIntentProductKeyMatchesPolicy({ priceId: P.brainProfile }, "brain_profile"),
    ).toBe(true);
  });

  it("returns true when priceId + funnel_step match declared product_key", () => {
    withEnv(SERVER_ENV, () => {
      expect(
        paymentIntentProductKeyMatchesPolicy(
          { priceId: P.brainProfile, funnel_step: "paywall" },
          "brain_profile",
        ),
      ).toBe(true);
    });
  });

  it("returns false when declared key does not match price ID", () => {
    withEnv(SERVER_ENV, () => {
      expect(
        paymentIntentProductKeyMatchesPolicy(
          { priceId: P.roadmap28Day, funnel_step: "upsell" },
          "brain_profile",
        ),
      ).toBe(false);
    });
  });

  it("returns false for unknown price ID (cannot derive expected key)", () => {
    withEnv(SERVER_ENV, () => {
      expect(
        paymentIntentProductKeyMatchesPolicy(
          { priceId: P.unknown, funnel_step: "paywall" },
          "brain_profile",
        ),
      ).toBe(false);
    });
  });
});

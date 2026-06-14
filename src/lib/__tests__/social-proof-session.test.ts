import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPROVED_TESTIMONIALS,
  SOCIAL_PROOF_POOL_VERSION,
} from "@/data/testimonials";
import {
  SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
  getOrCreateSocialProofJourney,
  resetInMemorySocialProofJourneyForTests,
} from "@/lib/social-proof-session";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class ThrowingStorage {
  getItem(): string | null {
    throw new Error("blocked");
  }

  setItem(): void {
    throw new Error("blocked");
  }
}

beforeEach(() => {
  resetInMemorySocialProofJourneyForTests();
  vi.unstubAllGlobals();
});

describe("social proof session journey", () => {
  it("does not create or persist a journey outside the browser", () => {
    let seedCalls = 0;
    let storageReads = 0;
    const journey = getOrCreateSocialProofJourney({
      storage: {
        getItem: () => {
          storageReads += 1;
          return null;
        },
        setItem: () => undefined,
      },
      seedFactory: () => {
        seedCalls += 1;
        return "server";
      },
    });

    expect(journey.result).toHaveLength(0);
    expect(journey.paywall).toHaveLength(0);
    expect(seedCalls).toBe(0);
    expect(storageReads).toBe(0);
  });

  it("persists one journey under the versioned session key", () => {
    const storage = new MemoryStorage();
    installBrowser(storage);
    const first = getOrCreateSocialProofJourney({
      seedFactory: () => "seed-one",
    });
    const second = getOrCreateSocialProofJourney({
      seedFactory: () => "seed-two",
    });

    expect(storage.getItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY)).toBeTruthy();
    expect(ids(second)).toEqual(ids(first));
    expect(first.result).toHaveLength(3);
    expect(first.paywall).toHaveLength(3);
    expect(new Set(ids(first)).size).toBe(6);
  });

  it("falls back to in-memory persistence when storage is unavailable", () => {
    installBrowser(null);
    const first = getOrCreateSocialProofJourney({
      storage: null,
      seedFactory: () => "memory-one",
    });
    const second = getOrCreateSocialProofJourney({
      storage: null,
      seedFactory: () => "memory-two",
    });

    expect(ids(second)).toEqual(ids(first));
  });

  it("does not crash when storage access throws", () => {
    installBrowser(null);
    const first = getOrCreateSocialProofJourney({
      storage: new ThrowingStorage(),
      seedFactory: () => "blocked-one",
    });
    const second = getOrCreateSocialProofJourney({
      storage: new ThrowingStorage(),
      seedFactory: () => "blocked-two",
    });

    expect(first.result).toHaveLength(3);
    expect(first.paywall).toHaveLength(3);
    expect(ids(second)).toEqual(ids(first));
  });

  it("regenerates invalid stored selections", () => {
    const storage = new MemoryStorage();
    installBrowser(storage);
    storage.setItem(
      SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: SOCIAL_PROOF_POOL_VERSION,
        seed: "bad",
        resultIds: ["proof-001", "proof-001", "missing"],
        paywallIds: [],
      }),
    );

    const journey = getOrCreateSocialProofJourney({
      storage,
      seedFactory: () => "replacement",
    });

    expect(journey.result).toHaveLength(3);
    expect(journey.paywall).toHaveLength(3);
    expect(new Set(ids(journey)).size).toBe(6);
    expect(JSON.parse(storage.getItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY) ?? ""))
      .toMatchObject({ seed: "replacement" });
  });

  it("never hydrates unapproved entries from storage", () => {
    const storage = new MemoryStorage();
    installBrowser(storage);
    storage.setItem(
      SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: SOCIAL_PROOF_POOL_VERSION,
        seed: "draft",
        resultIds: ["draft", "proof-002", "proof-011"],
        paywallIds: ["proof-003", "proof-004", "proof-009"],
      }),
    );

    const testimonials = [
      {
        ...APPROVED_TESTIMONIALS[0],
        id: "draft",
        approved: false,
      },
      ...APPROVED_TESTIMONIALS,
    ];
    const journey = getOrCreateSocialProofJourney({
      testimonials,
      storage,
      seedFactory: () => "approved-only",
    });

    expect(ids(journey)).not.toContain("draft");
    expect(new Set(ids(journey)).size).toBe(6);
  });

  it("rejects stored result entries that are not result-eligible", () => {
    const storage = new MemoryStorage();
    installBrowser(storage);
    storage.setItem(
      SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: SOCIAL_PROOF_POOL_VERSION,
        seed: "old-placement",
        resultIds: ["proof-001", "proof-002", "proof-011"],
        paywallIds: ["proof-003", "proof-004", "proof-009"],
      }),
    );

    const journey = getOrCreateSocialProofJourney({
      storage,
      seedFactory: () => "replacement-placement",
    });

    expect(journey.result.every((entry) =>
      entry.eligiblePlacement.includes("result_transition"),
    )).toBe(true);
    expect(journey.paywall.every((entry) =>
      entry.eligiblePlacement.includes("paywall_post_checkout"),
    )).toBe(true);
    expect(journey.result.map((entry) => entry.id)).not.toContain("proof-001");
    expect(JSON.parse(storage.getItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY) ?? ""))
      .toMatchObject({ seed: "replacement-placement" });
  });

  it("rejects stored inactive entries instead of partially reusing them", () => {
    const storage = new MemoryStorage();
    installBrowser(storage);
    storage.setItem(
      SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: SOCIAL_PROOF_POOL_VERSION,
        seed: "inactive",
        resultIds: ["proof-002", "proof-007", "proof-011"],
        paywallIds: ["proof-003", "proof-004", "proof-012"],
      }),
    );

    const journey = getOrCreateSocialProofJourney({
      storage,
      seedFactory: () => "replacement-inactive",
    });
    const picked = ids(journey);

    expect(picked).not.toContain("proof-007");
    expect(picked).not.toContain("proof-012");
    expect(new Set(picked).size).toBe(6);
    expect(JSON.parse(storage.getItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY) ?? ""))
      .toMatchObject({ seed: "replacement-inactive" });
  });
});

function ids(journey: {
  result: readonly { id: string }[];
  paywall: readonly { id: string }[];
}): string[] {
  return [...journey.result, ...journey.paywall].map((entry) => entry.id);
}

function installBrowser(storage: Storage | MemoryStorage | null): void {
  vi.stubGlobal("window", { sessionStorage: storage });
}

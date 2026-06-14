import { beforeEach, describe, expect, it } from "vitest";

import { APPROVED_TESTIMONIALS } from "@/data/testimonials";
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
});

describe("social proof session journey", () => {
  it("persists one journey under the versioned session key", () => {
    const storage = new MemoryStorage();
    const first = getOrCreateSocialProofJourney({
      storage,
      seedFactory: () => "seed-one",
    });
    const second = getOrCreateSocialProofJourney({
      storage,
      seedFactory: () => "seed-two",
    });

    expect(storage.getItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY)).toBeTruthy();
    expect(ids(second)).toEqual(ids(first));
    expect(first.result).toHaveLength(3);
    expect(first.paywall).toHaveLength(3);
    expect(new Set(ids(first)).size).toBe(6);
  });

  it("falls back to in-memory persistence when storage is unavailable", () => {
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
    storage.setItem(
      SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: "2026-06-14-v1",
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
  });

  it("never hydrates unapproved entries from storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SOCIAL_PROOF_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: "2026-06-14-v1",
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
});

function ids(journey: {
  result: readonly { id: string }[];
  paywall: readonly { id: string }[];
}): string[] {
  return [...journey.result, ...journey.paywall].map((entry) => entry.id);
}


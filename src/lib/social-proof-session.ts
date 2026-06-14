import {
  APPROVED_TESTIMONIALS,
  SOCIAL_PROOF_POOL_VERSION,
  selectSocialProofJourney,
  type ApprovedTestimonial,
  type SocialProofJourney,
} from "@/data/testimonials";

export const SOCIAL_PROOF_JOURNEY_STORAGE_KEY =
  `focusroute_social_proof_journey:${SOCIAL_PROOF_POOL_VERSION}`;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

interface StoredJourney {
  version: string;
  seed: string;
  resultIds: string[];
  paywallIds: string[];
}

let inMemoryStoredJourney: StoredJourney | null = null;

function safeSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function createSessionSeed(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `seed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storePayload(seed: string, journey: SocialProofJourney): StoredJourney {
  return {
    version: SOCIAL_PROOF_POOL_VERSION,
    seed,
    resultIds: journey.result.map((testimonial) => testimonial.id),
    paywallIds: journey.paywall.map((testimonial) => testimonial.id),
  };
}

function hydrateStoredJourney(
  stored: StoredJourney,
  testimonials: readonly ApprovedTestimonial[],
): SocialProofJourney | null {
  if (stored.version !== SOCIAL_PROOF_POOL_VERSION) return null;

  const byId = new Map(
    testimonials
      .filter((testimonial) => testimonial.approved)
      .map((testimonial) => [testimonial.id, testimonial]),
  );
  const result = stored.resultIds
    .map((id) => byId.get(id))
    .filter((testimonial): testimonial is ApprovedTestimonial =>
      Boolean(testimonial),
    );
  const paywall = stored.paywallIds
    .map((id) => byId.get(id))
    .filter((testimonial): testimonial is ApprovedTestimonial =>
      Boolean(testimonial),
    );
  const ids = [...result, ...paywall].map((testimonial) => testimonial.id);
  const unique = new Set(ids);

  if (result.length !== 3 || paywall.length !== 3) return null;
  if (unique.size !== ids.length) return null;

  return { result, paywall };
}

function parseStoredJourney(
  raw: string | null,
  testimonials: readonly ApprovedTestimonial[],
): SocialProofJourney | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredJourney>;
    if (
      parsed.version !== SOCIAL_PROOF_POOL_VERSION ||
      typeof parsed.seed !== "string" ||
      !Array.isArray(parsed.resultIds) ||
      !Array.isArray(parsed.paywallIds)
    ) {
      return null;
    }
    return hydrateStoredJourney(
      {
        version: parsed.version,
        seed: parsed.seed,
        resultIds: parsed.resultIds.filter(
          (id): id is string => typeof id === "string",
        ),
        paywallIds: parsed.paywallIds.filter(
          (id): id is string => typeof id === "string",
        ),
      },
      testimonials,
    );
  } catch {
    return null;
  }
}

function readJourneyFromStorage(
  storage: StorageLike | null,
  testimonials: readonly ApprovedTestimonial[],
): SocialProofJourney | null {
  if (!storage) return null;
  try {
    return parseStoredJourney(
      storage.getItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY),
      testimonials,
    );
  } catch {
    return null;
  }
}

function readJourneyFromMemory(
  testimonials: readonly ApprovedTestimonial[],
): SocialProofJourney | null {
  return inMemoryStoredJourney
    ? hydrateStoredJourney(inMemoryStoredJourney, testimonials)
    : null;
}

function persistJourney(
  storage: StorageLike | null,
  payload: StoredJourney,
): void {
  inMemoryStoredJourney = payload;
  if (!storage) return;
  try {
    storage.setItem(SOCIAL_PROOF_JOURNEY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // The in-memory copy above keeps the current JS session stable.
  }
}

export function getOrCreateSocialProofJourney({
  testimonials = APPROVED_TESTIMONIALS,
  storage = safeSessionStorage(),
  seedFactory = createSessionSeed,
}: {
  testimonials?: readonly ApprovedTestimonial[];
  storage?: StorageLike | null;
  seedFactory?: () => string;
} = {}): SocialProofJourney {
  const stored =
    readJourneyFromStorage(storage, testimonials) ??
    readJourneyFromMemory(testimonials);
  if (stored) return stored;

  const seed = seedFactory();
  const journey = selectSocialProofJourney(testimonials, seed);
  persistJourney(storage, storePayload(seed, journey));
  return journey;
}

export function resetInMemorySocialProofJourneyForTests(): void {
  inMemoryStoredJourney = null;
}


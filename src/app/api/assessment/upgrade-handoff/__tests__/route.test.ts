import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: supabaseMocks.createClient,
}));

// The handoff must never touch Stripe. Mock the client to throw if anyone tries,
// and assert it is never constructed.
const stripeMocks = vi.hoisted(() => ({
  getStripeClient: vi.fn(() => {
    throw new Error("the upgrade handoff must not call Stripe");
  }),
}));
vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: stripeMocks.getStripeClient,
}));

import { GET } from "@/app/api/assessment/upgrade-handoff/route";

type QuizRow = Record<string, unknown>;

let quizRows: QuizRow[];

function setUser(user: { id: string; email: string } | null) {
  supabaseMocks.getUser.mockResolvedValue({ data: { user } });
}

beforeEach(() => {
  vi.clearAllMocks();
  quizRows = [];
  supabaseMocks.createClient.mockImplementation(async () => ({
    auth: { getUser: supabaseMocks.getUser },
    from: supabaseMocks.from,
  }));
  supabaseMocks.from.mockImplementation(() => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => Promise.resolve({ data: quizRows }),
    };
    return builder;
  });
  setUser({ id: "user-1", email: "buyer@example.com" });
});

async function callHandoff(need?: string) {
  const url =
    need === undefined
      ? "https://focusroute.test/api/assessment/upgrade-handoff"
      : `https://focusroute.test/api/assessment/upgrade-handoff?need=${encodeURIComponent(need)}`;
  const res = await GET(new Request(url));
  return {
    cache: res.headers.get("Cache-Control"),
    body: (await res.json()) as Record<string, unknown>,
  };
}

const ROW_WITH_ANSWERS: QuizRow = {
  id: "row-1",
  email: "buyer@example.com",
  name: "Sam",
  answers: [{ questionId: "q1", selectedOptions: ["a"] }],
};

describe("GET /api/assessment/upgrade-handoff", () => {
  it("restores context and opens the requested step for a valid session + assessment", async () => {
    quizRows = [ROW_WITH_ANSWERS];

    const { cache, body } = await callHandoff("brain_profile");

    expect(cache).toBe("no-store");
    expect(body).toEqual({
      authorized: true,
      step: "paywall",
      email: "buyer@example.com",
      name: "Sam",
      quizResultId: "row-1",
      answers: [{ questionId: "q1", selectedOptions: ["a"] }],
    });
    // Only the assessment table is read; no payment tables, no Stripe.
    expect(supabaseMocks.from).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.from).toHaveBeenCalledWith("quiz_results");
    expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty("clientSecret");
    expect(body).not.toHaveProperty("payment_intent");
  });

  it("maps roadmap, bonus and membership needs to their funnel steps", async () => {
    quizRows = [ROW_WITH_ANSWERS];
    await expect(callHandoff("roadmap_28_day")).resolves.toMatchObject({
      body: { authorized: true, step: "upsell" },
    });
    await expect(callHandoff("bonus_toolkit")).resolves.toMatchObject({
      body: { authorized: true, step: "upsell" },
    });
    await expect(callHandoff("membership")).resolves.toMatchObject({
      body: { authorized: true, step: "subscription" },
    });
  });

  it("denies a query parameter with no session (login is required, never assumed)", async () => {
    setUser(null);

    const { body } = await callHandoff("brain_profile");

    expect(body).toEqual({ authorized: false, reason: "unauthenticated" });
    // No assessment lookup happens without a session.
    expect(supabaseMocks.from).not.toHaveBeenCalled();
    expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
  });

  it("shows assessment-required recovery when the user has no saved assessment", async () => {
    quizRows = [];

    const { body } = await callHandoff("brain_profile");

    expect(body).toEqual({ authorized: false, reason: "no_assessment" });
  });

  it("treats a saved row without usable answers as no assessment", async () => {
    quizRows = [{ id: "row-1", email: "buyer@example.com" }];

    const { body } = await callHandoff("brain_profile");

    expect(body).toEqual({ authorized: false, reason: "no_assessment" });
  });

  it("rejects an unknown or manipulated need before touching auth or the database", async () => {
    const invalid = await callHandoff("success");
    expect(invalid.body).toEqual({ authorized: false, reason: "invalid_request" });

    const missing = await callHandoff();
    expect(missing.body).toEqual({ authorized: false, reason: "invalid_request" });

    expect(supabaseMocks.createClient).not.toHaveBeenCalled();
    expect(supabaseMocks.getUser).not.toHaveBeenCalled();
    expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: supabaseMocks.createClient,
}));

const entitlementMocks = vi.hoisted(() => ({
  getActiveEntitlementKindsForUser: vi.fn(),
}));
vi.mock("@/lib/access/entitlements", () => ({
  getActiveEntitlementKindsForUser:
    entitlementMocks.getActiveEntitlementKindsForUser,
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
let entitlementKinds: Set<string>;

function setUser(user: { id: string; email: string } | null) {
  supabaseMocks.getUser.mockResolvedValue({ data: { user } });
}

function setEntitlements(...keys: string[]) {
  entitlementKinds = new Set(keys);
}

beforeEach(() => {
  vi.clearAllMocks();
  quizRows = [];
  setEntitlements();
  entitlementMocks.getActiveEntitlementKindsForUser.mockImplementation(
    async () => entitlementKinds,
  );
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

async function expectOwnedRedirect(
  need: string,
  entitlement: string,
  redirectTo: string,
  cta: string,
) {
  quizRows = [];
  setEntitlements(entitlement);

  const { body } = await callHandoff(need);

  expect(body).toEqual({
    authorized: false,
    reason: "already_unlocked",
    redirectTo,
    cta,
  });
  expect(entitlementMocks.getActiveEntitlementKindsForUser).toHaveBeenCalledWith(
    "user-1",
    "buyer@example.com",
  );
  expect(supabaseMocks.from).not.toHaveBeenCalled();
  expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
}

describe("GET /api/assessment/upgrade-handoff", () => {
  it("restores context and opens the requested step for a valid session + assessment", async () => {
    quizRows = [ROW_WITH_ANSWERS];

    const { cache, body } = await callHandoff("brain_profile");

    expect(cache).toBe("no-store");
    expect(body).toEqual({
      authorized: true,
      step: "subscription",
      email: "buyer@example.com",
      name: "Sam",
      quizResultId: "row-1",
      answers: [{ questionId: "q1", selectedOptions: ["a"] }],
    });
    // Only the assessment table is read through the session client; entitlement
    // access goes through the existing server-side helper. No payment tables,
    // no Stripe.
    expect(supabaseMocks.from).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.from).toHaveBeenCalledWith("quiz_results");
    expect(entitlementMocks.getActiveEntitlementKindsForUser).toHaveBeenCalledWith(
      "user-1",
      "buyer@example.com",
    );
    expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty("clientSecret");
    expect(body).not.toHaveProperty("payment_intent");
  });

  it("routes a not-yet-owned roadmap need to the subscription", async () => {
    quizRows = [ROW_WITH_ANSWERS];

    const { body } = await callHandoff("roadmap_28_day");

    expect(body).toMatchObject({
      authorized: true,
      step: "subscription",
    });
  });

  it("still routes a roadmap need to the subscription with only Brain Profile", async () => {
    quizRows = [ROW_WITH_ANSWERS];
    setEntitlements("brain_profile");

    await expect(callHandoff("roadmap_28_day")).resolves.toMatchObject({
      body: { authorized: true, step: "subscription" },
    });
  });

  it("routes a membership need to the subscription with partial entitlements", async () => {
    quizRows = [ROW_WITH_ANSWERS];
    setEntitlements("brain_profile");

    await expect(callHandoff("membership")).resolves.toMatchObject({
      body: { authorized: true, step: "subscription" },
    });
  });

  it("routes a membership need to the subscription with Roadmap access", async () => {
    quizRows = [ROW_WITH_ANSWERS];
    setEntitlements("roadmap_28_day");

    await expect(callHandoff("membership")).resolves.toMatchObject({
      body: { authorized: true, step: "subscription" },
    });
  });

  it("routes an unowned bonus_toolkit to the subscription, opens it once owned via Roadmap", async () => {
    quizRows = [ROW_WITH_ANSWERS];

    await expect(callHandoff("bonus_toolkit")).resolves.toMatchObject({
      body: { authorized: true, step: "subscription" },
    });

    setEntitlements("brain_profile");
    await expect(callHandoff("bonus_toolkit")).resolves.toMatchObject({
      body: { authorized: true, step: "subscription" },
    });

    setEntitlements("roadmap_28_day");
    await expect(callHandoff("bonus_toolkit")).resolves.toMatchObject({
      body: {
        authorized: false,
        reason: "already_unlocked",
        redirectTo: "/dashboard/bonuses",
        cta: "View Bonuses",
      },
    });
  });

  it("routes a membership need to the subscription regardless of partial entitlements", async () => {
    quizRows = [ROW_WITH_ANSWERS];

    const { body } = await callHandoff("membership");

    expect(body).toMatchObject({ authorized: true, step: "subscription" });
  });

  it("routes owned Brain Profile without assessment data to the dashboard profile", async () => {
    await expectOwnedRedirect(
      "brain_profile",
      "brain_profile",
      "/dashboard/profile",
      "Open Brain Profile",
    );
  });

  it("routes owned Roadmap without assessment data to the dashboard roadmap", async () => {
    await expectOwnedRedirect(
      "roadmap_28_day",
      "roadmap_28_day",
      "/dashboard/roadmap",
      "Open 28-Day Protocol",
    );
  });

  it("routes owned Bonus Toolkit without assessment data to dashboard bonuses", async () => {
    await expectOwnedRedirect(
      "bonus_toolkit",
      "roadmap_28_day",
      "/dashboard/bonuses",
      "View Bonuses",
    );
  });

  it("routes owned Membership without assessment data to dashboard membership", async () => {
    await expectOwnedRedirect(
      "membership",
      "membership",
      "/dashboard/membership",
      "Open Membership",
    );
  });

  it("denies a query parameter with no session (login is required, never assumed)", async () => {
    setUser(null);

    const { body } = await callHandoff("brain_profile");

    expect(body).toEqual({ authorized: false, reason: "unauthenticated" });
    // No assessment lookup happens without a session.
    expect(supabaseMocks.from).not.toHaveBeenCalled();
    expect(entitlementMocks.getActiveEntitlementKindsForUser).not.toHaveBeenCalled();
    expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
  });

  it("shows assessment-required recovery when the user has no saved assessment", async () => {
    quizRows = [];

    const { body } = await callHandoff("brain_profile");

    expect(body).toEqual({ authorized: false, reason: "no_assessment" });
    expect(entitlementMocks.getActiveEntitlementKindsForUser).toHaveBeenCalledWith(
      "user-1",
      "buyer@example.com",
    );
  });

  it("treats a saved row without usable answers as no assessment", async () => {
    quizRows = [{ id: "row-1", email: "buyer@example.com" }];

    const { body } = await callHandoff("brain_profile");

    expect(body).toEqual({ authorized: false, reason: "no_assessment" });
    expect(entitlementMocks.getActiveEntitlementKindsForUser).toHaveBeenCalledWith(
      "user-1",
      "buyer@example.com",
    );
  });

  it("rejects an unknown or manipulated need before touching auth or the database", async () => {
    const invalid = await callHandoff("success");
    expect(invalid.body).toEqual({ authorized: false, reason: "invalid_request" });

    const missing = await callHandoff();
    expect(missing.body).toEqual({ authorized: false, reason: "invalid_request" });

    expect(supabaseMocks.createClient).not.toHaveBeenCalled();
    expect(supabaseMocks.getUser).not.toHaveBeenCalled();
    expect(entitlementMocks.getActiveEntitlementKindsForUser).not.toHaveBeenCalled();
    expect(stripeMocks.getStripeClient).not.toHaveBeenCalled();
  });
});

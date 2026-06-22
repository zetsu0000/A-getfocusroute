import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const rateLimitMocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

const adminMocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/rate-limit/server", () => ({
  enforceRateLimit: rateLimitMocks.enforceRateLimit,
  rateLimitResponse: () =>
    Response.json({ error: "rate_limited", code: "rate_limited" }, { status: 429 }),
  temporaryUnavailableResponse: () =>
    Response.json({ error: "temporarily_unavailable" }, { status: 503 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: authMocks.getUser },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: adminMocks.from,
  }),
}));

vi.mock("@/lib/email/result-email-service", () => ({
  sendResultEmail: vi.fn(async () => ({ status: "previewed", idempotencyKey: "k", provider: "mock" })),
}));

import { POST } from "@/app/api/result-email/request/route";
import { sendResultEmail } from "@/lib/email/result-email-service";
import { mintGuestResultEmailToken } from "@/lib/email/guest-result-token";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/result-email/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/result-email/request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
    delete process.env.RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED;
    rateLimitMocks.enforceRateLimit.mockResolvedValue({ ok: true });
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
    });
    adminMocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "11111111-1111-4111-8111-111111111111",
              user_id: "user-1",
              email: "user@example.com",
              answers: [{ questionId: "focus-feeling", selectedOptions: ["stall"] }],
            },
            error: null,
          }),
        }),
      }),
    });
  });

  it("uses split pre-auth and authenticated rate-limit policies once each", async () => {
    await POST(jsonRequest({ resultId: "11111111-1111-4111-8111-111111111111" }));

    expect(rateLimitMocks.enforceRateLimit).toHaveBeenCalledTimes(2);
    expect(rateLimitMocks.enforceRateLimit.mock.calls[0]?.[0]).toBe("resultEmailRequestPreAuth");
    expect(rateLimitMocks.enforceRateLimit.mock.calls[1]?.[0]).toBe(
      "resultEmailRequestAuthenticated",
    );
  });

  it("returns a generic response without exposing stored email", async () => {
    const response = await POST(
      jsonRequest({ resultId: "11111111-1111-4111-8111-111111111111" }),
    );
    const body = await response.json();
    expect(response.status).toBe(202);
    expect(body.message).toContain("If this request can be processed");
    expect(JSON.stringify(body)).not.toContain("user@example.com");
    expect(sendResultEmail).not.toHaveBeenCalled();
  });

  it("does not send when feature flags remain disabled", async () => {
    await POST(jsonRequest({ resultId: "11111111-1111-4111-8111-111111111111" }));
    expect(sendResultEmail).not.toHaveBeenCalled();
  });

  it("rejects mismatched authenticated rows with the same generic response", async () => {
    adminMocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "11111111-1111-4111-8111-111111111111",
              user_id: "other-user",
              email: "user@example.com",
              answers: [],
            },
            error: null,
          }),
        }),
      }),
    });

    const response = await POST(
      jsonRequest({ resultId: "11111111-1111-4111-8111-111111111111" }),
    );
    expect(response.status).toBe(202);
    expect(sendResultEmail).not.toHaveBeenCalled();
  });
});

describe("POST /api/result-email/request (guest path)", () => {
  const RESULT_ID = "11111111-1111-4111-8111-111111111111";
  const GUEST_EMAIL = "guest@example.com";
  const SECRET = "guest-token-secret-for-route-tests";

  function guestRow(overrides: Record<string, unknown> = {}) {
    adminMocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: RESULT_ID,
              user_id: null,
              email: GUEST_EMAIL,
              answers: [{ questionId: "focus-feeling", selectedOptions: ["stall"] }],
              ...overrides,
            },
            error: null,
          }),
        }),
      }),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMocks.enforceRateLimit.mockResolvedValue({ ok: true });
    process.env.RESULT_EMAIL_GUEST_TOKEN_SECRET = SECRET;
    process.env.RESULT_EMAIL_SENDING_ENABLED = "true";
    process.env.RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED = "true";
    // Guest path must never require a session: getUser must not be consulted.
    authMocks.getUser.mockRejectedValue(new Error("getUser must not be called"));
    guestRow();
  });

  afterEach(() => {
    delete process.env.RESULT_EMAIL_GUEST_TOKEN_SECRET;
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
    delete process.env.RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED;
  });

  it("sends for a valid guest proof token without authentication", async () => {
    const token = mintGuestResultEmailToken(RESULT_ID, GUEST_EMAIL, SECRET)!;
    const response = await POST(jsonRequest({ resultId: RESULT_ID, token }));

    expect(response.status).toBe(202);
    expect(sendResultEmail).toHaveBeenCalledTimes(1);
    const [input, , options] = (sendResultEmail as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0]!;
    expect((input as { recipientSource: { kind: string; email: string } }).recipientSource).toEqual({
      kind: "submitted_quiz_result_email",
      resultId: RESULT_ID,
      email: GUEST_EMAIL,
      explicitDeliveryRequest: true,
    });
    expect(options).toEqual({ category: "transactional" });
    // Only the pre-auth limiter runs; the authenticated limiter never does.
    expect(rateLimitMocks.enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(rateLimitMocks.enforceRateLimit.mock.calls[0]?.[0]).toBe("resultEmailRequestPreAuth");
    expect(authMocks.getUser).not.toHaveBeenCalled();
  });

  it("does not send when the proof token is forged", async () => {
    const response = await POST(
      jsonRequest({ resultId: RESULT_ID, token: "1.deadbeef" }),
    );
    expect(response.status).toBe(202);
    expect(sendResultEmail).not.toHaveBeenCalled();
  });

  it("does not send when the token belongs to a different email (no arbitrary recipient)", async () => {
    const otherToken = mintGuestResultEmailToken(RESULT_ID, "attacker@example.com", SECRET)!;
    const response = await POST(jsonRequest({ resultId: RESULT_ID, token: otherToken }));
    expect(response.status).toBe(202);
    expect(sendResultEmail).not.toHaveBeenCalled();
  });

  it("does not send when transactional flags are disabled", async () => {
    process.env.RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED = "false";
    const token = mintGuestResultEmailToken(RESULT_ID, GUEST_EMAIL, SECRET)!;
    const response = await POST(jsonRequest({ resultId: RESULT_ID, token }));
    expect(response.status).toBe(202);
    expect(sendResultEmail).not.toHaveBeenCalled();
  });

  it("does not leak the stored email in the response", async () => {
    const token = mintGuestResultEmailToken(RESULT_ID, GUEST_EMAIL, SECRET)!;
    const response = await POST(jsonRequest({ resultId: RESULT_ID, token }));
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(GUEST_EMAIL);
  });

  it("returns generic 202 for an unknown result id (no enumeration signal)", async () => {
    adminMocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    });
    const token = mintGuestResultEmailToken(RESULT_ID, GUEST_EMAIL, SECRET)!;
    const response = await POST(jsonRequest({ resultId: RESULT_ID, token }));
    expect(response.status).toBe(202);
    expect(sendResultEmail).not.toHaveBeenCalled();
  });
});

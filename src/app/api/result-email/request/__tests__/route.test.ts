import { describe, expect, it, vi, beforeEach } from "vitest";

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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const unsubscribeMock = vi.hoisted(() => ({
  recordMarketingUnsubscribe: vi.fn(async () => undefined),
}));

vi.mock("@/lib/email/email-preferences", () => ({
  recordMarketingUnsubscribe: unsubscribeMock.recordMarketingUnsubscribe,
}));

import { GET, POST } from "@/app/api/email/unsubscribe/route";
import { hashEmailForPreferences } from "@/lib/email/email-hash";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token";

describe("email unsubscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_PREFERENCE_HASH_SECRET = "hash-secret";
    process.env.EMAIL_UNSUBSCRIBE_TOKEN_SECRET = "token-secret";
  });

  it("GET with valid token renders a POST form and does not mutate", async () => {
    const emailHash = hashEmailForPreferences("user@example.com", "hash-secret")!;
    const token = createUnsubscribeToken({ emailHash })!;
    const response = await GET(new Request(`http://localhost/api/email/unsubscribe?token=${encodeURIComponent(token)}`));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('method="post"');
    expect(html).toContain('name="token"');
    expect(unsubscribeMock.recordMarketingUnsubscribe).not.toHaveBeenCalled();
  });

  it("GET with invalid token does not mutate", async () => {
    const response = await GET(new Request("http://localhost/api/email/unsubscribe?token=invalid"));
    expect(response.status).toBe(400);
    expect(unsubscribeMock.recordMarketingUnsubscribe).not.toHaveBeenCalled();
  });

  it("POST with valid token unsubscribes by email hash and is idempotent", async () => {
    const emailHash = hashEmailForPreferences("user@example.com", "hash-secret")!;
    const token = createUnsubscribeToken({ emailHash })!;
    const form = new FormData();
    form.set("token", token);

    const first = await POST(new Request("http://localhost/api/email/unsubscribe", { method: "POST", body: form }));
    const second = await POST(new Request("http://localhost/api/email/unsubscribe", { method: "POST", body: form }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(unsubscribeMock.recordMarketingUnsubscribe).toHaveBeenCalledTimes(2);
    expect(unsubscribeMock.recordMarketingUnsubscribe).toHaveBeenCalledWith(emailHash);
  });

  it("token uses separate hash and token secrets and has no expiry field", () => {
    const emailHash = hashEmailForPreferences("user@example.com", "hash-secret")!;
    const token = createUnsubscribeToken({ emailHash })!;
    expect(token).not.toContain("@");
    expect(token.split(".")[0]).not.toContain("exp");
  });

  it("GET route source does not call recordMarketingUnsubscribe", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../route.ts", import.meta.url)),
      "utf8",
    );
    const getSection = source.split("export async function POST")[0] ?? "";
    expect(getSection).not.toContain("recordMarketingUnsubscribe(");
    expect(source).toContain("recordMarketingUnsubscribe(");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canSendMarketingEmail,
  getMarketingStatusForRecipient,
  recordMarketingConsent,
  recordMarketingUnsubscribe,
} from "@/lib/email/email-preferences";
import { hashEmailForPreferences } from "@/lib/email/email-hash";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe-token";
import { assertLifecycleSendingDisabled } from "@/lib/email/templates/lifecycle";

const adminMocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: adminMocks.from,
  }),
}));

function mockPreferenceRow(status: string | null, error: unknown = null) {
  adminMocks.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: status ? { marketing_status: status } : null, error }),
      }),
    }),
    upsert: async () => ({ error: null }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) }),
  });
}

describe("marketing consent foundation", () => {
  it("blocks marketing when status is unknown", () => {
    expect(canSendMarketingEmail("unknown")).toBe(false);
    expect(canSendMarketingEmail("consented")).toBe(true);
    expect(canSendMarketingEmail("unsubscribed")).toBe(false);
  });

  it("keeps lifecycle sending disabled in PR 7B", () => {
    expect(() => assertLifecycleSendingDisabled()).not.toThrow();
  });
});

describe("canonical recipient status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_PREFERENCE_HASH_SECRET = "hash-secret";
    process.env.EMAIL_UNSUBSCRIBE_TOKEN_SECRET = "token-secret";
  });

  it("reads marketing status by email hash only", async () => {
    mockPreferenceRow("unsubscribed");
    const status = await getMarketingStatusForRecipient({
      email: "user@example.com",
      userId: "user-1",
      resultId: "result-1",
    });
    expect(status).toBe("unsubscribed");
  });

  it("throws on read failure", async () => {
    mockPreferenceRow(null, { message: "read failed" });
    await expect(
      getMarketingStatusForRecipient({ email: "user@example.com" }),
    ).rejects.toThrow("email_preferences_read_failed");
  });

  it("upserts consent by email hash", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    adminMocks.from.mockReturnValue({ upsert });
    await recordMarketingConsent({
      email: "user@example.com",
      consentSource: "future_ui",
      consentVersion: "1",
      userId: "user-1",
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email_hash: hashEmailForPreferences("user@example.com", "hash-secret") }),
      { onConflict: "email_hash" },
    );
  });

  it("upserts global unsubscribe by email hash", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    adminMocks.from.mockReturnValue({ upsert });
    await recordMarketingUnsubscribe("abc123");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email_hash: "abc123", marketing_status: "unsubscribed" }),
      { onConflict: "email_hash" },
    );
  });
});

describe("signed PII-safe unsubscribe token", () => {
  beforeEach(() => {
    process.env.EMAIL_PREFERENCE_HASH_SECRET = "hash-secret";
    process.env.EMAIL_UNSUBSCRIBE_TOKEN_SECRET = "token-secret";
  });

  it("creates versioned tokens without raw email or expiry", () => {
    const emailHash = hashEmailForPreferences("user@example.com", "hash-secret")!;
    const token = createUnsubscribeToken({ emailHash })!;
    expect(token).not.toContain("@");
    expect(verifyUnsubscribeToken(token)).toEqual({ version: 1, emailHash });
  });
});

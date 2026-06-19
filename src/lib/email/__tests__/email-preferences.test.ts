import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canSendMarketingEmail,
} from "@/lib/email/email-preferences";
import {
  createUnsubscribeToken,
  hashEmailForPreferences,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe-token";
import { assertLifecycleSendingDisabled } from "@/lib/email/templates/lifecycle";

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

describe("unsubscribe token", () => {
  it("creates and verifies opaque unsubscribe tokens without raw email", () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-unsubscribe-secret";
    const emailHash = hashEmailForPreferences("user@example.com", "test-unsubscribe-secret");
    const token = createUnsubscribeToken({ emailHash, userId: "user-1" });
    expect(token).toBeTruthy();
    expect(token).not.toContain("@");
    expect(verifyUnsubscribeToken(token!)).toMatchObject({ emailHash, userId: "user-1" });
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET;
  });
});

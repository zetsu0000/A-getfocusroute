import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  mintGuestResultEmailToken,
  verifyGuestResultEmailToken,
} from "@/lib/email/guest-result-token";

const SECRET = "test-guest-token-secret-value";
const RESULT_ID = "11111111-1111-4111-8111-111111111111";
const EMAIL = "guest@example.com";

describe("guest result-email token", () => {
  it("mints a token that verifies against the same result and email", () => {
    const token = mintGuestResultEmailToken(RESULT_ID, EMAIL, SECRET);
    expect(token).toBeTruthy();
    expect(verifyGuestResultEmailToken(token, RESULT_ID, EMAIL, SECRET)).toBe(true);
  });

  it("is stable across email casing (normalized binding)", () => {
    const token = mintGuestResultEmailToken(RESULT_ID, "Guest@Example.COM", SECRET);
    expect(verifyGuestResultEmailToken(token, RESULT_ID, EMAIL, SECRET)).toBe(true);
  });

  it("rejects a token for a different email (no arbitrary recipient)", () => {
    const token = mintGuestResultEmailToken(RESULT_ID, EMAIL, SECRET);
    expect(
      verifyGuestResultEmailToken(token, RESULT_ID, "attacker@example.com", SECRET),
    ).toBe(false);
  });

  it("rejects a token for a different result id (no enumeration)", () => {
    const token = mintGuestResultEmailToken(RESULT_ID, EMAIL, SECRET);
    expect(
      verifyGuestResultEmailToken(
        token,
        "22222222-2222-4222-8222-222222222222",
        EMAIL,
        SECRET,
      ),
    ).toBe(false);
  });

  it("rejects a tampered or forged token", () => {
    const token = mintGuestResultEmailToken(RESULT_ID, EMAIL, SECRET)!;
    expect(verifyGuestResultEmailToken(token + "00", RESULT_ID, EMAIL, SECRET)).toBe(false);
    expect(verifyGuestResultEmailToken("1.deadbeef", RESULT_ID, EMAIL, SECRET)).toBe(false);
    expect(verifyGuestResultEmailToken("", RESULT_ID, EMAIL, SECRET)).toBe(false);
  });

  it("rejects tokens signed with a different secret", () => {
    const token = mintGuestResultEmailToken(RESULT_ID, EMAIL, SECRET);
    expect(verifyGuestResultEmailToken(token, RESULT_ID, EMAIL, "other-secret")).toBe(false);
  });

  it("fails closed when no signing secret is configured", () => {
    expect(mintGuestResultEmailToken(RESULT_ID, EMAIL, null)).toBeNull();
    expect(verifyGuestResultEmailToken("anything", RESULT_ID, EMAIL, null)).toBe(false);
  });

  it("returns null for unusable input", () => {
    expect(mintGuestResultEmailToken("", EMAIL, SECRET)).toBeNull();
    expect(mintGuestResultEmailToken(RESULT_ID, "not-an-email", SECRET)).toBeNull();
  });
});

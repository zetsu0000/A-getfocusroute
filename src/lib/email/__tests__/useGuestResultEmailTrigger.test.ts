import { describe, expect, it, vi } from "vitest";

import {
  postGuestResultEmailTrigger,
  resultEmailTriggerStorageKey,
  shouldTriggerGuestResultEmail,
} from "@/lib/email/useGuestResultEmailTrigger";

describe("shouldTriggerGuestResultEmail", () => {
  const base = {
    quizResultId: "11111111-1111-4111-8111-111111111111",
    token: "1.abc",
    alreadyFired: false,
    alreadyTriggered: false,
  };

  it("triggers once for a guest with a result id and token", () => {
    expect(shouldTriggerGuestResultEmail(base)).toBe(true);
  });

  it("does not trigger without a proof token (guest-only, never login path)", () => {
    expect(shouldTriggerGuestResultEmail({ ...base, token: null })).toBe(false);
  });

  it("does not trigger without a result id", () => {
    expect(shouldTriggerGuestResultEmail({ ...base, quizResultId: null })).toBe(false);
  });

  it("does not re-trigger when already fired this mount", () => {
    expect(shouldTriggerGuestResultEmail({ ...base, alreadyFired: true })).toBe(false);
  });

  it("does not re-trigger when a prior visit already triggered (refresh/return)", () => {
    expect(shouldTriggerGuestResultEmail({ ...base, alreadyTriggered: true })).toBe(false);
  });
});

describe("resultEmailTriggerStorageKey", () => {
  it("namespaces by result id", () => {
    expect(resultEmailTriggerStorageKey("abc")).toBe(
      "focusroute_result_email_triggered:abc",
    );
  });
});

describe("postGuestResultEmailTrigger", () => {
  it("posts only resultId + token (recipient resolved server-side)", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    await postGuestResultEmailTrigger("rid", "tok", fetchImpl as unknown as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("/api/result-email/request");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ resultId: "rid", token: "tok" });
    expect(body).not.toHaveProperty("email");
  });

  it("never throws on network failure (checkout must not break)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    await expect(
      postGuestResultEmailTrigger("rid", "tok", fetchImpl as unknown as typeof fetch),
    ).resolves.toBeUndefined();
  });
});

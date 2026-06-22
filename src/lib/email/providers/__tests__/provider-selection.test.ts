import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createResultEmailProvider } from "@/lib/email/result-email-service";

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("createResultEmailProvider", () => {
  it("selects the Resend adapter when RESULT_EMAIL_PROVIDER=resend", () => {
    process.env.RESULT_EMAIL_PROVIDER = "resend";
    expect(createResultEmailProvider().name).toBe("resend");
  });

  it("returns the disabled noop provider when no provider is configured", () => {
    delete process.env.RESULT_EMAIL_PROVIDER;
    expect(createResultEmailProvider().name).toBe("noop");
  });

  it("never falls back to mock in production", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.RESULT_EMAIL_PROVIDER = "mock";
    process.env.RESULT_EMAIL_ALLOW_MOCK = "true";
    expect(createResultEmailProvider().name).not.toBe("mock");
    process.env.NODE_ENV = previous;
  });

  it("selects Resend (not mock) in production when configured", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.RESULT_EMAIL_PROVIDER = "resend";
    expect(createResultEmailProvider().name).toBe("resend");
    process.env.NODE_ENV = previous;
  });
});

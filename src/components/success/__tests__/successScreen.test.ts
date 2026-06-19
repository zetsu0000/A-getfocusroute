import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * Source-level guards for the post-purchase Success Screen. Like the checkout
 * and social-proof suites, the screen is a client-only component (framer-motion
 * + the FocusField canvas) rendered in a DOM-less `node` test environment, so we
 * assert the copy and structural invariants against the component source.
 */
const src = readFileSync(
  fileURLToPath(new URL("../SuccessScreen.tsx", import.meta.url)),
  "utf8",
);

describe("success screen — confirmation", () => {
  it("confirms the subscription and uses the approved unlock confirmation", () => {
    expect(src).toContain("Subscription confirmed");
    expect(src).toContain("is unlocked.");
    expect(src).toContain("FocusRoute");
  });

  it("avoids ready / instrumentation framings", () => {
    expect(src).not.toContain("Your FocusRoute is ready");
    expect(src).not.toContain("Brain OS activated");
    expect(src).not.toContain("scan complete");
    expect(src).not.toContain("signal detected");
    expect(src).not.toContain("diagnostic result unlocked");
    expect(src).not.toContain("cognition unlocked");
  });
});

describe("success screen — first action and access list", () => {
  it("gives one obvious first action in plain language", () => {
    expect(src).toContain("Start by seeing where focus breaks most for you");
  });

  it("lists what is now available in the account, concisely", () => {
    expect(src).toContain("In your account");
    expect(src).toContain("Your detailed focus breakdown");
    expect(src).toContain("Your 28-day action path");
    expect(src).toContain("Practical tools for difficult moments");
  });
});

describe("success screen — single primary CTA to the real destination", () => {
  it("uses one primary CTA that opens the existing dashboard", () => {
    expect(src).toContain("Open My FocusRoute");
    expect(src).toContain('href="/dashboard"');
    // exactly one rendered CTA link (no second competing primary action)
    expect(src.split('className="v2-cta v2-cta-gold"').length - 1).toBe(1);
    expect(src.split("<Link").length - 1).toBe(1);
  });
});

describe("success screen — no unsupported claims", () => {
  it("makes no email-delivery promise and drops the mail framing", () => {
    expect(src).not.toContain("Mail");
    expect(src).not.toContain("We emailed your");
    expect(src).not.toContain("Check your inbox");
    expect(src).not.toContain("report has been sent");
    expect(src).not.toContain("results are waiting in your inbox");
  });

  it("keeps only an accurate account-association message", () => {
    expect(src).toContain("Access saved to");
    expect(src).toContain("sign in with it anytime");
  });

  it("makes no Customer Portal / cancellation-path claim", () => {
    expect(src).not.toContain("Customer Portal");
    expect(src).not.toContain("Cancel from your dashboard");
    expect(src).not.toContain("Manage your subscription");
  });
});

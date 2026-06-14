import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = readFileSync(
  fileURLToPath(new URL("../SocialProof.tsx", import.meta.url)),
  "utf8",
);

describe("social proof components", () => {
  it("renders three result testimonials from the shared session journey", () => {
    expect(src).toContain("getOrCreateSocialProofJourney().result");
    expect(src).toContain("testimonials.map");
    expect(src).toContain("quoteLines={2}");
  });

  it("shows one paywall testimonial initially and exactly two on expansion", () => {
    expect(src).toContain("journey.paywall[0]");
    expect(src).toContain("journey.paywall.slice(1, 3)");
    expect(src).toContain("<details");
    expect(src).toContain("<summary");
    expect(src).not.toContain("<details open");
  });

  it("keeps the paywall expansion keyboard-accessible and quietly discoverable", () => {
    expect(src).toContain("Show more customer experiences");
    expect(src).toContain("ChevronDown");
    expect(src).not.toContain("See more");
  });

  it("fires the expansion event only once per user expansion", () => {
    expect(src).toContain("FIRST_PARTY_EVENTS.socialProofExpanded");
    expect(src).toContain("expandedTrackedRef.current");
    expect(src).toContain("if (!isOpen || expandedTrackedRef.current) return");
  });

  it("uses safe impression metadata for visible approved testimonials", () => {
    expect(src).toContain("FIRST_PARTY_EVENTS.socialProofImpression");
    expect(src).toContain("buildImpressionMetadata");
    expect(src).toContain("groupId");
    expect(src).not.toContain("signature_key");
    expect(src).not.toContain("match_type");
  });

  it("keeps fixed avatar dimensions and a missing-image fallback", () => {
    expect(src).toContain("width={size}");
    expect(src).toContain("height={size}");
    expect(src).toContain("objectFit: \"cover\"");
    expect(src).toContain("onError={() => setImageOk(false)}");
    expect(src).toContain("initial");
  });
});


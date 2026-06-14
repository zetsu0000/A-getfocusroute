import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  PaywallSocialProofDisclosure,
  ResultSocialProof,
} from "../SocialProof";

const src = readFileSync(
  fileURLToPath(new URL("../SocialProof.tsx", import.meta.url)),
  "utf8",
);

describe("social proof components", () => {
  it("creates the journey only after client mount", () => {
    expect(src).toContain("function useSocialProofJourney");
    expect(src).toContain("useEffect(() =>");
    expect(src).toContain("queueMicrotask");
    expect(src).toContain("getOrCreateSocialProofJourney()");
    expect(src).not.toContain("useMemo(() => getOrCreateSocialProofJourney");
  });

  it("renders no testimonial HTML during server rendering", () => {
    const throwingWindow = {};
    Object.defineProperty(throwingWindow, "sessionStorage", {
      get: () => {
        throw new Error("sessionStorage accessed during render");
      },
    });
    vi.stubGlobal("window", throwingWindow);

    try {
      expect(renderToString(createElement(ResultSocialProof))).toBe("");
      expect(renderToString(createElement(PaywallSocialProofDisclosure))).toBe("");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("renders three result testimonials from the shared client journey", () => {
    expect(src).toContain("const journey = useSocialProofJourney()");
    expect(src).toContain("testimonials.map");
    expect(src).toContain("quoteLines={2}");
  });

  it("shows one paywall testimonial initially and exactly two on expansion", () => {
    expect(src).toContain("journey?.paywall[0]");
    expect(src).toContain("journey?.paywall.slice(1, 3)");
    expect(src).toContain("open && expanded.length > 0");
    expect(src).toContain("<details");
    expect(src).toContain("<summary");
    expect(src).not.toContain("<details open");
  });

  it("shows full paywall quotes after expansion while result proof stays compact", () => {
    expect(src).toContain("fullQuote={open}");
    expect(src).toContain("fullQuote");
    expect(src).toContain("quoteLines={2}");
    expect(src).toContain("quoteLines={3}");
    expect(src).toContain("WebkitLineClamp: quoteLines");

    const resultComponent = src.slice(
      src.indexOf("export function ResultSocialProof"),
      src.indexOf("export function PaywallSocialProofDisclosure"),
    );
    const paywallComponent = src.slice(
      src.indexOf("export function PaywallSocialProofDisclosure"),
    );

    expect(resultComponent).toContain("quoteLines={2}");
    expect(resultComponent).not.toContain("fullQuote");
    expect(paywallComponent).toContain("fullQuote={open}");
    expect(paywallComponent).toContain("fullQuote");
  });

  it("uses the same client-created journey for both placements", () => {
    const resultComponent = src.slice(
      src.indexOf("export function ResultSocialProof"),
      src.indexOf("export function PaywallSocialProofDisclosure"),
    );
    const paywallComponent = src.slice(
      src.indexOf("export function PaywallSocialProofDisclosure"),
    );

    expect(resultComponent).toContain("useSocialProofJourney()");
    expect(paywallComponent).toContain("useSocialProofJourney()");
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
    expect(src).not.toContain("/api/create-payment-intent");
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

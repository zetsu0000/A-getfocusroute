import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

/*
 * Source-level guards for the email-gate content-density pass. The funnel
 * components are client-only and the project has no DOM test environment, so
 * these assert the structural invariants directly against the component source.
 */
const src = readFileSync(
  fileURLToPath(new URL("../EmailScreen.tsx", import.meta.url)),
  "utf8",
);

describe("EmailScreen content density (no redesign)", () => {
  it("keeps exactly one insight panel — the single existing v2-panel", () => {
    const panelHits = (src.match(/className="v2-panel"/g) || []).length;
    expect(panelHits).toBe(1);

    // that panel is the WHAT WE FOUND insight, driven by signature.preview
    expect(src).toContain("What we found");
    expect(src).toContain("{signature.preview}");
    const whatWeFoundHits = (src.match(/What we found/g) || []).length;
    expect(whatWeFoundHits).toBe(1);
  });

  it("keeps the required preview header copy", () => {
    expect(src).toContain("Pattern identified — your free preview");
    expect(src).toContain("You&apos;re a");
    expect(src).toContain("{signature.title}");
  });

  it("removes the optional first-name field and its name-capture logic", () => {
    expect(src).not.toContain("First name");
    expect(src).not.toContain("localName");
    expect(src).not.toContain("setLocalName");
    expect(src).not.toContain("setName");
    expect(src).not.toContain("toTitleCase");
  });

  it("removes the consequence block and the locked-next-step block", () => {
    expect(src).not.toContain("In your full breakdown");
    expect(src).not.toContain("firstStepTeaserFor");
    expect(src).not.toContain("{signature.frictionLine}");
    // the locked block's Lock icon is gone from this screen
    expect(src).not.toContain('from "lucide-react"');
    expect(src).not.toContain("<Lock");
  });

  it("removes the explanatory paragraph, large privacy card, and refund link", () => {
    expect(src).not.toContain("Save your results to see");
    expect(src).not.toContain("/refund-policy");
    expect(src).not.toContain("Refund Policy");
    // the dedicated privacy card (its own panel + shield gradient) is gone;
    // the privacy line is now plain text, so no extra panel/gradient remains
    expect(src).not.toContain("linear-gradient");
  });

  it("uses the exact CTA copy 'Reveal My Focus Profile'", () => {
    expect(src).toContain("Reveal My Focus Profile");
    // the old CTA wording is fully gone
    expect(src).not.toContain("See My Full Results");
    expect(src).not.toContain("Save &amp; See My Full Results");
    expect(src).not.toContain("Save & See My Full Results");
  });

  it("keeps email as the only required field with validation + submit intact", () => {
    expect(src).toContain('local.includes("@")');
    expect(src).toContain('local.includes(".")');
    expect(src).toContain("v2-input-error");
    expect(src).toContain("Please enter a valid email address");
    expect(src).toContain("setEmail(local.trim().toLowerCase())");
    expect(src).toContain('setStep("chart")');
    expect(src).toContain('type="email"');
    // exactly one text input survives (the email field); no second input
    const inputHits = (src.match(/<input/g) || []).length;
    expect(inputHits).toBe(1);
  });

  it("preserves the funnel analytics events (no renames, no duplicates)", () => {
    for (const ev of [
      "FIRST_PARTY_EVENTS.resultPreviewViewed",
      "FIRST_PARTY_EVENTS.emailFieldFocused",
      "FIRST_PARTY_EVENTS.emailSubmitted",
    ]) {
      expect((src.match(new RegExp(ev.replace(".", "\\."), "g")) || []).length).toBe(1);
    }
    // the underlying event names themselves are unchanged
    expect(FIRST_PARTY_EVENTS.resultPreviewViewed).toBe("result_preview_viewed");
    expect(FIRST_PARTY_EVENTS.emailFieldFocused).toBe("email_field_focused");
    expect(FIRST_PARTY_EVENTS.emailSubmitted).toBe("email_submitted");
  });

  it("preserves the existing visual system and introduces no new classes", () => {
    // the FocusRoute design tokens stay in place
    expect(src).toContain("v2-display");
    expect(src).toContain("v2-panel");
    expect(src).toContain("v2-input");
    expect(src).toContain("v2-cta");
    expect(src).toContain("HudLabel");
    expect(src).toContain("radial-gradient"); // signature ambient background

    // every static className token belongs to the known FocusRoute set
    const allowed = new Set([
      "v2-display",
      "v2-panel",
      "v2-input",
      "v2-input-error",
      "v2-cta",
    ]);
    const used = new Set<string>();
    for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{[^}]*?"([^"]*)"[^}]*?\})/g)) {
      const raw = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\$\{[^}]*\}/g, " ");
      for (const tok of raw.split(/\s+/)) {
        if (tok.trim()) used.add(tok.trim());
      }
    }
    for (const cls of used) {
      expect(allowed.has(cls)).toBe(true);
    }

    // no paywall-specific or chip styling sneaks in
    expect(src).not.toContain("v2-cta-gold");
    expect(src.toLowerCase()).not.toContain("chip");
  });
});

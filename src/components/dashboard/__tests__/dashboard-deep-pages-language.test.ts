import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { getExplainScriptBundle, ADHD_TOOLKIT_ITEMS, FOCUS_AUDIO_SESSIONS } from "@/data/bonuses";
import { ROADMAP_DAYS } from "@/data/roadmap";
import { deriveBrainProfile } from "@/lib/dashboard/brain-profile";

/*
 * PR #60 — deep dashboard pages + navigation language alignment.
 *
 * The dashboard pages are server/client React with no DOM test environment, so
 * visible copy is guarded two ways:
 *   1. runtime assertions on the shared data the views render from, and
 *   2. targeted source-level checks on the specific labels/headlines.
 */
function src(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}

const navSrc = src("../DashboardNav.tsx");
const profileViewSrc = src("../BrainProfileView.tsx");
const roadmapViewSrc = src("../RoadmapProtocolView.tsx");
const toolsViewSrc = src("../BonusLibraryView.tsx");
const heroSrc = src("../../signature/SignatureHeroBadge.tsx");
const profilePageSrc = src("../../../app/dashboard/profile/page.tsx");
const roadmapPageSrc = src("../../../app/dashboard/roadmap/page.tsx");
const toolsPageSrc = src("../../../app/dashboard/bonuses/page.tsx");

// ── 1. Navigation labels ───────────────────────────────────────────────────────
describe("dashboard navigation labels", () => {
  it("shows the new utility-first labels", () => {
    expect(navSrc).toContain('label="Focus Pattern"');
    expect(navSrc).toContain('label="28-Day FocusRoute"');
    expect(navSrc).toContain('label="Focus Tools"');
  });

  it("no longer shows the old positioning labels", () => {
    expect(navSrc).not.toContain('label="Brain Profile"');
    expect(navSrc).not.toContain('label="28-Day Protocol"');
    expect(navSrc).not.toContain('label="Bonuses"');
  });
});

// ── 2. Profile page ─────────────────────────────────────────────────────────────
describe("profile page (Focus Pattern)", () => {
  it("page title + headline use Focus Pattern, not Brain Profile", () => {
    expect(profilePageSrc).toContain("Focus Pattern · FocusRoute");
    expect(profilePageSrc).not.toContain("Brain Profile · FocusRoute");
    expect(profilePageSrc).toContain("Your Focus Pattern");
    expect(profileViewSrc).toContain("Your Focus Pattern");
  });

  it("uses practical, non-clinical section labels", () => {
    expect(profileViewSrc).toContain("What helps you start");
    expect(profileViewSrc).toContain("Where focus gets harder");
    expect(profileViewSrc).toContain("How to get back on track");
    expect(profileViewSrc).toContain("Best focus conditions");
  });

  it("drops clinical / report wording", () => {
    expect(profileViewSrc).not.toContain("Cognitive Signature");
    expect(profileViewSrc).not.toContain("clinical");
    expect(profileViewSrc).not.toContain("Executive Function Radar");
    expect(profileViewSrc).not.toContain("Copy full script");
    expect(heroSrc).not.toContain("Cognitive Signature");
    expect(heroSrc).toContain("Focus Pattern");
  });
});

// ── 3. Roadmap page ─────────────────────────────────────────────────────────────
describe("roadmap page (28-Day FocusRoute)", () => {
  it("page title + headline use 28-Day FocusRoute", () => {
    expect(roadmapPageSrc).toContain("28-Day FocusRoute · FocusRoute");
    expect(roadmapViewSrc).toContain("28-Day FocusRoute");
    expect(roadmapViewSrc).not.toContain("28-Day Protocol");
    expect(roadmapViewSrc).not.toContain("Brain Profile");
  });

  it("uses week names", () => {
    for (const week of ["Start easier", "Stay with one task", "Recover from interruptions", "Build your repeatable focus system"]) {
      expect(roadmapViewSrc).toContain(week);
    }
  });

  it("disclaimer avoids clinical wording", () => {
    expect(roadmapViewSrc).not.toContain("clinical");
  });
});

// ── 4. Tools / bonuses page ──────────────────────────────────────────────────────
describe("tools page (Focus Tools)", () => {
  it("page title + headline use Focus Tools", () => {
    expect(toolsPageSrc).toContain("Focus Tools · FocusRoute");
    expect(toolsViewSrc).toContain("Focus Tools");
    expect(toolsViewSrc).not.toContain("Bonus Library");
    expect(toolsViewSrc).not.toMatch(/>\s*Bonuses\s*</);
  });

  it("renames the explanation tool and drops clinical wording", () => {
    expect(toolsViewSrc).toContain('title="Explain My Focus Pattern"');
    expect(toolsViewSrc).not.toContain('title="Explain-It-To-Someone Script"');
    expect(toolsViewSrc).not.toContain("Cognitive Signature");
    expect(toolsViewSrc).not.toContain("Copy full script");
    expect(toolsViewSrc).not.toContain("28-Day Protocol");
    expect(toolsViewSrc).not.toContain("Unlock Brain Profile");
  });
});

// ── 5. Shared data the deep pages render ─────────────────────────────────────────
const FORBIDDEN = [
  "cognitive signature",
  "neurotypical",
  "clinical",
  "diagnosis",
  "treatment",
  "disorder",
  "symptom",
  "adhd",
  "protocol",
  "script",
];

function assertClean(label: string, text: string) {
  const blob = text.toLowerCase();
  for (const term of FORBIDDEN) {
    // Word-boundary match so legitimate copy (e.g. "descriptions" containing
    // "script") is not flagged — we only want the standalone clinical/product term.
    const re = new RegExp(`\\b${term.replace(/[-/]/g, "\\$&")}\\b`);
    expect(re.test(blob), `forbidden term "${term}" in ${label}`).toBe(false);
  }
}

describe("post-purchase data is free of clinical / script wording", () => {
  it("Explain My Focus Pattern bundle (named + unnamed)", () => {
    for (const sig of ["Sprinter", null]) {
      const b = getExplainScriptBundle(sig);
      const text = [b.title, b.subtitle, b.opener, b.openerFollowUp, b.footerNote, ...b.blocks.flatMap((x) => [x.heading, ...x.paragraphs])].join("\n");
      assertClean(`explain bundle (${sig ?? "none"})`, text);
    }
    expect(getExplainScriptBundle(null).title).toBe("Explain My Focus Pattern");
  });

  it("toolkit + audio session copy", () => {
    const toolkit = ADHD_TOOLKIT_ITEMS.map((t) => [t.title, t.tagline, t.purpose, t.howToUse].join("\n")).join("\n");
    assertClean("toolkit", toolkit);
    const audio = FOCUS_AUDIO_SESSIONS.map((s) => [s.title, s.whenToUse, s.openingPrompt, s.outcome, ...(s.arc ?? [])].join("\n")).join("\n");
    assertClean("audio", audio);
  });

  it("roadmap day copy", () => {
    const days = ROADMAP_DAYS.map((d) => [d.title, d.objective, d.microAction, d.whyItWorks, d.reflectionPrompt].join("\n")).join("\n");
    assertClean("roadmap days", days);
  });

  it("derived focus-pattern copy (default + named signatures)", () => {
    const answers = [
      { questionId: "scale-procrastination", selectedOptions: ["3"] },
      { questionId: "scale-focus", selectedOptions: ["3"] },
      { questionId: "scale-overwhelm", selectedOptions: ["3"] },
      { questionId: "scale-organization", selectedOptions: ["3"] },
      { questionId: "scale-memory", selectedOptions: ["3"] },
      { questionId: "scale-emotions", selectedOptions: ["3"] },
      { questionId: "obstacles", selectedOptions: ["method", "distraction"] },
      { questionId: "mood", selectedOptions: ["sometimes"] },
    ] as unknown as Parameters<typeof deriveBrainProfile>[0];
    for (const sig of [null, "Sprinter", "Drifter"]) {
      const p = deriveBrainProfile(answers, sig, null);
      const text = [
        p.signatureName,
        p.profileExplanation,
        p.initiationStyle,
        p.distractionRecovery,
        ...p.focusConditions,
        ...p.finallyExplanation,
      ].join("\n");
      assertClean(`derived profile (${sig ?? "default"})`, text);
    }
    expect(deriveBrainProfile(answers, null, null).signatureName).toBe("Your Focus Pattern");
  });
});

// ── 6. Protected areas untouched ─────────────────────────────────────────────────
describe("scope: protected areas untouched", () => {
  it("deep-page views do not import billing / Stripe / email / analytics / supabase", () => {
    const sources = [navSrc, profileViewSrc, roadmapViewSrc, toolsViewSrc, heroSrc].join("\n");
    for (const mod of ["@/lib/stripe", "@/lib/billing", "@/lib/email", "@/lib/analytics", "@/lib/meta", "@/lib/supabase"]) {
      expect(sources, `unexpected import: ${mod}`).not.toContain(mod);
    }
  });

  it("route paths are unchanged (labels-only PR)", () => {
    expect(navSrc).toContain("/dashboard/profile");
    expect(navSrc).toContain("/dashboard/roadmap");
    expect(navSrc).toContain("/dashboard/bonuses");
  });
});

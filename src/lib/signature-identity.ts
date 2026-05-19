/**
 * Cognitive Signature identity system.
 * Server-safe (no browser APIs).
 *
 * For each archetype this defines:
 *   - essence (one-liner)
 *   - motif (visual theme)
 *   - reveal copy (the one-line "reveal statement")
 *   - accent palette
 *   - sigilKey (which inner symbol to render)
 *
 * Used by SignatureSigil, SignatureRevealCard, SignatureHeroBadge,
 * ChartScreen, PaywallScreen, and dashboard BrainProfileView.
 */

export type SignatureKey = "Sprinter" | "Archivist" | "Spark" | "Reactor" | "Drifter";

export type SigilKey = "thrust" | "blueprint" | "burst" | "ember" | "orbit";

export interface SignatureIdentity {
  /** Archetype key (matches BrainSignature). */
  key: SignatureKey;
  /** Roman-numeral rank shown as a collectible class index (I-V). */
  classIndex: string;
  /** Short class-style label shown above the name. */
  classLabel: string;
  /** One-line essence, e.g. "Activation-driven momentum". */
  essence: string;
  /** Motif keyword used in copy. */
  motif: string;
  /** Inner sigil glyph identifier. */
  sigilKey: SigilKey;
  /** Short reveal statement shown during the reveal moment. */
  revealStatement: string;
  /** Short descriptive summary (one sentence). */
  summary: string;
  /** Per-signature palette (matches globals.css). */
  accent: string;
  accentDark: string;
  accentTint: string;
  accentRgb: string;       // "R,G,B" for rgba() composition
  /** Symbolic glyph word (single word badge / chip). */
  glyph: string;
}

export const SIGNATURE_ORDER: SignatureKey[] = [
  "Sprinter",
  "Archivist",
  "Spark",
  "Reactor",
  "Drifter",
];

export const SIGNATURE_IDENTITY: Record<SignatureKey, SignatureIdentity> = {
  Sprinter: {
    key: "Sprinter",
    classIndex: "I",
    classLabel: "Class · Activation",
    essence: "Activation-driven momentum",
    motif: "thrust",
    sigilKey: "thrust",
    revealStatement: "You move when the signal lands. Now you have the system to summon it.",
    summary: "Fast-cycle ignition. Excels with urgency cues and visible deadlines.",
    accent: "#2E6F9E",
    accentDark: "#1B4D77",
    accentTint: "#E5F1F8",
    accentRgb: "46,111,158",
    glyph: "Ignition",
  },
  Archivist: {
    key: "Archivist",
    classIndex: "II",
    classLabel: "Class · Depth",
    essence: "Depth-led precision",
    motif: "blueprint",
    sigilKey: "blueprint",
    revealStatement: "Your mind builds in layers. Now the structure can hold them.",
    summary: "Detail-rich processing. Performs best with clarity, structure, and bandwidth protection.",
    accent: "#20364F",
    accentDark: "#11253D",
    accentTint: "#F2F6F8",
    accentRgb: "32,54,79",
    glyph: "Blueprint",
  },
  Spark: {
    key: "Spark",
    classIndex: "III",
    classLabel: "Class · Signal",
    essence: "Novelty-powered synthesis",
    motif: "prism",
    sigilKey: "burst",
    revealStatement: "Your brain finds patterns in light. Now you have the lens to focus them.",
    summary: "Idea-driven engine. Strong starts, needs a container to carry momentum through.",
    accent: "#4C3FD7",
    accentDark: "#2F25A8",
    accentTint: "#ECE9FF",
    accentRgb: "76,63,215",
    glyph: "Signal",
  },
  Reactor: {
    key: "Reactor",
    classIndex: "IV",
    classLabel: "Class · Ember",
    essence: "Pressure-sensitive responsiveness",
    motif: "ember",
    sigilKey: "ember",
    revealStatement: "You read the room before it speaks. Now you have a reset that holds.",
    summary: "Adaptive responsiveness. Fast under stakes, regulation-sensitive under load.",
    accent: "#C04D3F",
    accentDark: "#8B2F23",
    accentTint: "#FBE9E6",
    accentRgb: "192,77,63",
    glyph: "Ember",
  },
  Drifter: {
    key: "Drifter",
    classIndex: "V",
    classLabel: "Class · Orbit",
    essence: "Anchor-seeking flexibility",
    motif: "orbit",
    sigilKey: "orbit",
    revealStatement: "Your attention follows meaning. Now you can place the anchors.",
    summary: "Low-friction default mode. Needs external anchors and visible milestones.",
    accent: "#B8751D",
    accentDark: "#824E0D",
    accentTint: "#FEF0D8",
    accentRgb: "184,117,29",
    glyph: "Orbit",
  },
};

export function getSignatureIdentity(key: string | null | undefined): SignatureIdentity {
  if (key && key in SIGNATURE_IDENTITY) {
    return SIGNATURE_IDENTITY[key as SignatureKey];
  }
  // Fallback to Drifter palette — neutral & not alarming.
  return SIGNATURE_IDENTITY.Drifter;
}

export function isSignatureKey(value: unknown): value is SignatureKey {
  return typeof value === "string" && value in SIGNATURE_IDENTITY;
}

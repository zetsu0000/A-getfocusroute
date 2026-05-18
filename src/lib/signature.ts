import { QuizAnswer } from "@/types/quiz";

export type BrainSignature =
  | "Sprinter"
  | "Archivist"
  | "Spark"
  | "Reactor"
  | "Drifter";

export interface SignatureResult {
  signature: BrainSignature;
  title: string;
  preview: string;
  strengths: string[];
  unlockTeaser: string[];
}

const SIGNATURES: Record<BrainSignature, Omit<SignatureResult, "signature">> = {
  Sprinter: {
    title: "Fast starts, uneven finish lines",
    preview:
      "You move quickly when urgency is high, but routine tasks can stall without a clear activation trigger.",
    strengths: [
      "High momentum in short bursts",
      "Strong creative problem solving under time pressure",
      "Responds well to visible deadlines and checkpoints",
    ],
    unlockTeaser: [
      "Your complete Executive Function Radar™ scores",
      "Your Profile-to-Protocol™ Engine plan for task initiation",
      "A day-by-day 28-Day Protocol™ adapted to sprint cycles",
    ],
  },
  Archivist: {
    title: "Detail-rich, load-sensitive",
    preview:
      "You notice details and context quickly, but cognitive load rises when priorities are unclear or tasks stack up.",
    strengths: [
      "Strong memory for context and specifics",
      "Excellent quality control and pattern recognition",
      "Performs best with clear structure and prep windows",
    ],
    unlockTeaser: [
      "Your complete Executive Function Radar™ scores",
      "Your Profile-to-Protocol™ Engine plan for overload prevention",
      "A day-by-day 28-Day Protocol™ for consistency without burnout",
    ],
  },
  Spark: {
    title: "Idea-driven, novelty-powered",
    preview:
      "You generate momentum through curiosity and novelty, then need a system to turn great starts into finished outcomes.",
    strengths: [
      "High idea generation and creative thinking",
      "Strong engagement when tasks feel meaningful",
      "Quick adaptation when environments change",
    ],
    unlockTeaser: [
      "Your complete Executive Function Radar™ scores",
      "Your Profile-to-Protocol™ Engine plan for follow-through",
      "A day-by-day 28-Day Protocol™ that channels novelty into execution",
    ],
  },
  Reactor: {
    title: "Responsive, pressure-sensitive",
    preview:
      "You react quickly to changes and demands, but emotional load can disrupt planning and sustained execution.",
    strengths: [
      "Fast responsiveness in dynamic situations",
      "Strong situational awareness and adaptability",
      "Can recover quickly with clear reset cues",
    ],
    unlockTeaser: [
      "Your complete Executive Function Radar™ scores",
      "Your Profile-to-Protocol™ Engine plan for regulation and recovery",
      "A day-by-day 28-Day Protocol™ with built-in reset loops",
    ],
  },
  Drifter: {
    title: "Flexible attention, low-friction mode",
    preview:
      "Your attention can drift without external anchors, especially on low-stimulation work or long planning horizons.",
    strengths: [
      "Calm under low-pressure environments",
      "Can focus deeply when context is clear and meaningful",
      "Benefits quickly from lightweight structure",
    ],
    unlockTeaser: [
      "Your complete Executive Function Radar™ scores",
      "Your Profile-to-Protocol™ Engine plan for attention anchoring",
      "A day-by-day 28-Day Protocol™ for sustainable follow-through",
    ],
  },
};

function hashAnswers(answers: QuizAnswer[]): number {
  const normalized = [...answers]
    .sort((a, b) => a.questionId.localeCompare(b.questionId))
    .map((answer) => ({
      questionId: answer.questionId,
      selectedOptions: [...answer.selectedOptions].sort(),
    }));

  const input = JSON.stringify(normalized);
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const ORDER: BrainSignature[] = [
  "Sprinter",
  "Archivist",
  "Spark",
  "Reactor",
  "Drifter",
];

export function getSignatureFromAnswers(answers: QuizAnswer[]): SignatureResult {
  const index = hashAnswers(answers) % ORDER.length;
  const signature = ORDER[index];
  return { signature, ...SIGNATURES[signature] };
}

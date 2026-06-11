import type { QuizAnswer } from "@/types/quiz";

// Scale questions: "1" = Not at all → "5" = Always (strongly agree)
// All statements describe friction → higher value = more friction = lower strength
const SCALE_STRENGTH: Record<string, number> = {
  "1": 90, "2": 74, "3": 52, "4": 28, "5": 10,
};

// Q3 mood: how quickly user recovers focus after disruption
const RECOVERY_STRENGTH: Record<string, number> = {
  never: 90,     // "I recover quickly most days"
  rarely: 72,    // "usually recover with short reset"
  sometimes: 52, // "depends on how much is on my plate"
  often: 30,     // "often stay off track longer"
  always: 10,    // "struggle to recover once derailed"
};

function pick(answers: QuizAnswer[], id: string): string {
  return answers.find(a => a.questionId === id)?.selectedOptions[0] ?? "";
}

function pickAll(answers: QuizAnswer[], id: string): string[] {
  return answers.find(a => a.questionId === id)?.selectedOptions ?? [];
}

function scaleDimScore(answers: QuizAnswer[], id: string): number {
  const v = pick(answers, id);
  return SCALE_STRENGTH[v] ?? 52;
}

export type RadarDimension = {
  label: string;
  shortLabel: string;
  score: number; // 0–100, higher = stronger (less friction)
};

export type StrengthItem = { label: string; detail: string };
export type FrictionItem = { label: string; detail: string };

export type BrainProfileData = {
  signatureName: string;
  signatureTitle: string;
  signatureDesc: string;
  radarDimensions: RadarDimension[];
  overallScore: number;
  profileExplanation: string;
  strengths: StrengthItem[];
  frictionPoints: FrictionItem[];
  focusConditions: string[];
  initiationStyle: string;
  distractionRecovery: string;
  finallyExplanation: string[];
};

type SigEntry = {
  title: string;
  desc: string;
  profileExplanation: string;
  narrative: string[];
};

const SIG_DATA: Record<string, SigEntry> = {
  Sprinter: {
    title: "Fast starts, uneven finish lines",
    desc: "You move quickly when urgency is high, but routine tasks can stall without a clear activation trigger.",
    profileExplanation:
      "Your brain is optimized for high-stimulation launch windows. When a task has urgency, novelty, or clear stakes, you can generate remarkable momentum. The challenge is that your nervous system waits for that activation signal — making low-stakes or repetitive tasks feel heavier than they should.",
    narrative: [
      "If you've spent years wondering why you can crush a deadline but can't seem to start that one simple task — this is why. Your brain runs on activation, not intention.",
      "You're not lazy. You're not inconsistent on purpose. Your initiation system is just more selective than most productivity advice assumes.",
      "The goal isn't to force motivation. It's to design launch conditions your nervous system actually responds to — urgency cues, body-doubling, very specific first actions.",
      "That gap between knowing what to do and starting it? It's a wiring pattern, not a character flaw.",
    ],
  },
  Archivist: {
    title: "Detail-rich, load-sensitive",
    desc: "You notice details and context quickly, but cognitive load rises when priorities are unclear or tasks stack up.",
    profileExplanation:
      "Your brain is built for depth and quality. You notice what others miss, hold complex context across long time spans, and produce careful, considered work. The cost: when too many things compete for bandwidth — unclear priorities, shifting demands, stacked commitments — your system can hit a wall faster than most people expect.",
    narrative: [
      "If you've been called 'too perfectionistic' while feeling like you're just trying to do things right — this maps that experience. Your brain allocates cognitive resources generously, and that has a real cost.",
      "The overwhelm you feel when your plate is too full isn't weakness. It's a processing limit, like running too many browser tabs at once.",
      "The solution isn't to care less. It's to create clear priority signals and protect your cognitive bandwidth with structure that respects how your brain loads.",
      "You do your best work when the environment respects your depth. That's a feature to design around, not a limitation to apologize for.",
    ],
  },
  Spark: {
    title: "Idea-driven, novelty-powered",
    desc: "You generate momentum through curiosity and novelty, then need a system to turn great starts into finished outcomes.",
    profileExplanation:
      "Your brain is a pattern-recognizer and idea generator. You make connections quickly, get genuinely engaged by new possibilities, and can enter deep flow when something captures your interest. The challenge: novelty-driven brains often find the completion phase less stimulating than the discovery phase — leading to strong starts and stalled middles.",
    narrative: [
      "If your notebook is full of brilliant ideas that never quite landed — this profile explains why. Your brain is wired to generate and explore, not to grind through the flat middle of execution.",
      "There's nothing wrong with how fast you can start things. The work is building systems that carry momentum through the parts your brain finds less interesting.",
      "The gap between your ideas and your follow-through isn't a motivation problem. It's a structure problem. The right containers change that.",
      "Your strengths are real: fast synthesis, creative leaps, genuine enthusiasm. The goal is a system that turns those into outcomes you can actually see.",
    ],
  },
  Reactor: {
    title: "Responsive, pressure-sensitive",
    desc: "You react quickly to changes and demands, but emotional load can disrupt planning and sustained execution.",
    profileExplanation:
      "Your brain is highly attuned to the emotional tone of your environment. You pick up on stakes, relationships, and changes quickly — making you fast-adapting in dynamic situations. The challenge: this same sensitivity can make sustained planned work harder when emotional pressure or interpersonal stress is elevated.",
    narrative: [
      "If a single difficult conversation has ever derailed your entire work day — this is that. Your nervous system processes emotional context alongside task context, simultaneously.",
      "The days when nothing gets done despite you trying really hard often have emotional undercurrents that most productivity advice does not account for.",
      "You're not making excuses. You're describing a wiring pattern that needs regulation support — reset rituals, emotional triage, and permission to name what's actually happening.",
      "Your responsiveness and situational awareness are genuine strengths. Learning to work with your regulation needs — not around them — is the real unlock.",
    ],
  },
  Drifter: {
    title: "Flexible attention, low-friction mode",
    desc: "Your attention can drift without external anchors, especially on low-stimulation work or long planning horizons.",
    profileExplanation:
      "Your brain tends toward a low-activation default — which can feel like calm and flexibility, but also means attention needs an external anchor or meaningful context to hold direction. Open-ended work, long tasks without visible milestones, and abstract goals are hardest. Short containers, visible progress, and a clear done-for-now signal work best.",
    narrative: [
      "If you've spent years feeling like you should just be able to sit down and do it — this maps why that doesn't happen automatically. Sustained attention isn't always self-generating; it often needs a scaffold.",
      "You're not unmotivated. Your brain is waiting for the right conditions to engage. The work is building those conditions, not trying harder inside the wrong setup.",
      "Low-friction mode can look like laziness from outside. From the inside it often feels like wanting to but not getting traction. Both are real. Neither is a character flaw.",
      "Small structure interventions create outsized results for this pattern — body-doubling, time-boxed blocks, visible done-tests. Not because you need to be controlled, but because your brain responds to structure others carry internally.",
    ],
  },
};

const DEFAULT_SIG: SigEntry = {
  title: "Attention-driven execution pattern",
  desc: "Your profile reflects a distinct attention and execution style, with strengths and friction points mapped below.",
  profileExplanation:
    "Your brain processes attention, motivation, and execution through a pattern that differs from the neurotypical model. Some things come easily — deep engagement, pattern recognition, fast responses under pressure — while others like task initiation, sustained routine work, and follow-through require deliberate scaffolding.",
  narrative: [
    "If you've spent years trying to explain why your brain works the way it does — to others, or to yourself — this profile maps what you've been experiencing.",
    "The patterns here aren't excuses. They're descriptions. Understanding them is the first step toward designing conditions that actually fit.",
    "The gap between knowing what to do and doing it is one of the most frustrating experiences people with this pattern describe. You're not alone, and it isn't permanent.",
    "The right system doesn't demand you become a different person. It meets you where you are and builds from there.",
  ],
};

function deriveFocusConditions(answers: QuizAnswer[]): string[] {
  const conditions: string[] = [];
  const sleep = pick(answers, "sleep");
  const time = pick(answers, "time");
  const support = pick(answers, "support");
  const impact = pickAll(answers, "daily-impact");

  if (sleep === "poor" || sleep === "medium") {
    conditions.push(
      "Protected recovery windows — energy crashes make everything harder; guarding downtime is a legitimate strategy.",
    );
  } else {
    conditions.push(
      "Energy-aligned scheduling — your relatively stable energy is an asset worth protecting from meeting overflow.",
    );
  }

  if (time === "5min" || time === "10min") {
    conditions.push(
      "Ultra-short sprint blocks (5–15 min) with a written done-test — small containers reduce the activation cost of starting.",
    );
  } else if (time === "20min") {
    conditions.push(
      "20-minute focused sprints with one clear first physical step written before the timer starts.",
    );
  } else {
    conditions.push(
      "Longer focus blocks (25–30 min) with a defined lane and a written 'done for today' marker before you begin.",
    );
  }

  if (support === "none") {
    conditions.push(
      "External structure tools — body-doubling, accountability check-ins, or co-working sessions substitute for structure others carry internally.",
    );
  } else if (support === "coaching") {
    conditions.push(
      "Your coaching or accountability setup is a real asset — leverage it for planning sessions, not just problem-solving.",
    );
  }

  if (impact.includes("work"))
    conditions.push("Batching similar tasks to cut the context-switching tax during work hours.");
  if (impact.includes("health"))
    conditions.push(
      "Habit-linking self-care to existing anchors rather than relying on motivation in the moment.",
    );
  if (impact.includes("creativity"))
    conditions.push(
      "Dedicated creative windows separate from admin work — your brain transitions between modes slowly.",
    );

  return conditions.slice(0, 4);
}

function deriveInitiationStyle(answers: QuizAnswer[], initiationScore: number): string {
  const obstacles = pickAll(answers, "obstacles");
  const experience = pick(answers, "experience");

  let base: string;
  if (initiationScore >= 68) {
    base =
      "Your task initiation is relatively strong — you can usually get started when conditions line up.";
  } else if (initiationScore >= 42) {
    base =
      "Task initiation takes deliberate effort. You often need a clear first physical step and an external activation signal before momentum begins.";
  } else {
    base =
      "Getting started is the primary friction point. Your nervous system needs more than intention — it needs a specific, visible first move with low enough stakes to feel safe to attempt.";
  }

  const additions: string[] = [];
  if (obstacles.includes("consistency"))
    additions.push(
      "Building consistent routines is harder than one-off tasks — use anchors rather than willpower.",
    );
  if (obstacles.includes("motivation"))
    additions.push("Day-one momentum fades; plan for the re-entry, not just the launch.");
  if (obstacles.includes("method"))
    additions.push(
      "Ambiguous process is a real blocker — a clear protocol reduces the decision tax before you start.",
    );
  if (obstacles.includes("distraction"))
    additions.push(
      "Context switching erodes initiation energy; protect your launch window from interruptions.",
    );
  if (experience === "tried")
    additions.push(
      "You've tried systems before. What's different here is starting from your actual profile, not a generic template.",
    );

  return [base, ...additions.slice(0, 2)].join(" ");
}

function deriveDistractionRecovery(
  answers: QuizAnswer[],
  recoveryScore: number,
  focusScore: number,
): string {
  const dist = pick(answers, "distraction");

  let base: string;
  if (recoveryScore >= 70 && focusScore >= 60) {
    base =
      "You recover from disruptions relatively well. A lightweight reset ritual (2–3 min) will sharpen this further and prevent the slow-burn drift that follows unacknowledged interruptions.";
  } else if (recoveryScore >= 42) {
    base =
      "Recovery from disruptions is inconsistent — sometimes quick, sometimes long. The difference is usually whether you have an explicit re-entry protocol or are relying on willpower alone.";
  } else {
    base =
      "Once derailed, getting back on track takes real effort. A named reset ritual — physical step, one breath, re-read of the task's done-test — shortens the recovery window significantly.";
  }

  if (dist === "always" || dist === "often") {
    return (
      base +
      " Time-slippage during task switches is frequent for you; keeping a quick 'where I left off' note is one of the highest-leverage habits you can build."
    );
  }
  return base;
}

const STRENGTH_DETAIL: Record<string, string> = {
  "Task Initiation":
    "You can get started when conditions line up — urgency, a clear first step, or an external trigger.",
  "Focus Sustain":
    "When context is right you can enter and hold focused states longer than average.",
  "Working Memory": "You hold details and context reliably when not overloaded.",
  "Planning": "Translating ideas into action sequences is accessible when the plan is concrete.",
  "Priority Filtering": "You can manage competing priorities when they are clearly ranked.",
  "Emotional Reg.":
    "You recover your emotional baseline more readily, keeping task flow more consistent.",
};

const FRICTION_DETAIL: Record<string, string> = {
  "Task Initiation":
    "Starting tasks is the primary friction — especially without urgency or a defined first step.",
  "Focus Sustain":
    "Holding attention on low-stimulation or repetitive work is consistently harder than it looks from outside.",
  "Working Memory": "Details and commitments drop without external capture systems in place.",
  "Planning":
    "Getting from 'I know what to do' to a concrete next action requires deliberate scaffolding.",
  "Priority Filtering": "When multiple things compete, choosing what matters right now is taxing.",
  "Emotional Reg.":
    "Emotional state can derail task flow; high-stakes or interpersonal stress has an outsized effect on output.",
};

export function deriveBrainProfile(
  answers: QuizAnswer[],
  savedSignatureName: string | null,
  savedSignatureDesc: string | null,
): BrainProfileData {
  const initiationScore = scaleDimScore(answers, "scale-procrastination");
  const focusScore = scaleDimScore(answers, "scale-focus");
  const priorityScore = scaleDimScore(answers, "scale-overwhelm");
  const planningScore = scaleDimScore(answers, "scale-organization");
  const memoryScore = scaleDimScore(answers, "scale-memory");
  const regulationScore = scaleDimScore(answers, "scale-emotions");

  const radarDimensions: RadarDimension[] = [
    { label: "Task Initiation", shortLabel: "Initiation", score: initiationScore },
    { label: "Focus Sustain", shortLabel: "Focus", score: focusScore },
    { label: "Working Memory", shortLabel: "Memory", score: memoryScore },
    { label: "Planning", shortLabel: "Planning", score: planningScore },
    { label: "Priority Filtering", shortLabel: "Priority", score: priorityScore },
    { label: "Emotional Reg.", shortLabel: "Regulation", score: regulationScore },
  ];

  const overallScore = Math.round(
    (initiationScore + focusScore + priorityScore + planningScore + memoryScore + regulationScore) /
      6,
  );

  const sig: SigEntry = (savedSignatureName ? SIG_DATA[savedSignatureName] : null) ?? DEFAULT_SIG;

  const ranked = [...radarDimensions].sort((a, b) => b.score - a.score);

  const strengths: StrengthItem[] = ranked.slice(0, 2).map(dim => ({
    label: dim.label,
    detail: STRENGTH_DETAIL[dim.label] ?? "Strong relative dimension.",
  }));

  const frictionPoints: FrictionItem[] = ranked
    .slice(-2)
    .reverse()
    .map(dim => ({
      label: dim.label,
      detail: FRICTION_DETAIL[dim.label] ?? "Primary friction area.",
    }));

  const recoveryScore = RECOVERY_STRENGTH[pick(answers, "mood")] ?? 52;

  return {
    signatureName: savedSignatureName ?? "Brain Profile",
    signatureTitle: sig.title,
    signatureDesc: savedSignatureDesc ?? sig.desc,
    radarDimensions,
    overallScore,
    profileExplanation: sig.profileExplanation,
    strengths,
    frictionPoints,
    focusConditions: deriveFocusConditions(answers),
    initiationStyle: deriveInitiationStyle(answers, initiationScore),
    distractionRecovery: deriveDistractionRecovery(answers, recoveryScore, focusScore),
    finallyExplanation: sig.narrative,
  };
}


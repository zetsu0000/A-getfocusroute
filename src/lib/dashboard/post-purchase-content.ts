/**
 * Post-purchase dashboard copy (presentation only).
 *
 * Centralized so the rebuilt /dashboard overview and its tests share one source
 * of truth. Plain, practical language — deliberately free of clinical/diagnostic
 * wording (no "script", "protocol", "cognitive signature", "neurotypical",
 * "diagnosis", "treatment", "disorder", "symptom", "ADHD"). Nothing here reads
 * scoring, billing, Stripe, email, or analytics.
 */

export const POST_PURCHASE_SECTIONS = {
  todaysMove: "Today’s Focus Move",
  focusTools: "Focus Tools",
  route: "28-Day FocusRoute",
  focusPattern: "Your Focus Pattern",
  retake: "Retake the quiz",
} as const;

export const TODAYS_FOCUS_MOVE = {
  eyebrow: "Start here",
  title: POST_PURCHASE_SECTIONS.todaysMove,
  lead: "Start with one task that has a visible first step.",
  steps: [
    "Pick one task.",
    "Write the first physical step.",
    "Work for 15 minutes.",
    "Leave a return note if interrupted.",
  ],
  cta: "Start today’s focus move",
} as const;

export type FocusTool = {
  name: string;
  /** When to use it. */
  useWhen: string;
  /** What the user gets from it. */
  gain: string;
};

export const FOCUS_TOOLS: readonly FocusTool[] = [
  {
    name: "First Step Builder",
    useWhen: "Use when starting feels too big.",
    gain: "Turn a vague task into one physical first step.",
  },
  {
    name: "Priority Filter",
    useWhen: "Use when everything feels important.",
    gain: "Choose what needs your attention now and what can wait.",
  },
  {
    name: "Comeback Note",
    useWhen: "Use before you stop or switch tasks.",
    gain: "Leave yourself one clear place to restart.",
  },
  {
    name: "2-Minute Reset",
    useWhen: "Use when you feel scattered, stuck, or overloaded.",
    gain: "Reset your body and attention before choosing the next step.",
  },
  {
    name: "15-Minute Focus Block",
    useWhen: "Use when finishing feels too far away.",
    gain: "Start with a short block and a clear stop point.",
  },
  {
    name: "Explain My Focus Pattern",
    useWhen: "Use when you need to describe your focus needs clearly.",
    gain: "Turn your result into a simple note for yourself or someone else.",
  },
] as const;

export type RouteWeek = { label: string; benefit: string };

export const FOCUS_ROUTE_WEEKS: readonly RouteWeek[] = [
  {
    label: "Week 1 — Start easier",
    benefit: "Make the first step smaller, clearer, and easier to begin.",
  },
  {
    label: "Week 2 — Stay with one task",
    benefit: "Reduce task switching and protect one focus lane at a time.",
  },
  {
    label: "Week 3 — Recover from interruptions",
    benefit: "Use return points so you do not have to restart from zero.",
  },
  {
    label: "Week 4 — Build your repeatable focus system",
    benefit: "Turn your best focus conditions into a weekly routine.",
  },
] as const;

export type FocusPatternCard = { title: string; body: string };

export const FOCUS_PATTERN = {
  intro:
    "Your answers suggest you do better when the next step is concrete, visible, and easy to return to. When priorities compete or the first step is unclear, starting can take more effort.",
  cards: [
    {
      title: "What helps you start",
      body: "You start more easily when the task has a clear first physical action.",
    },
    {
      title: "Where focus gets harder",
      body: "Focus gets harder when several tasks feel equally important or when the task has no obvious starting point.",
    },
    {
      title: "How to get back on track",
      body: "When you lose track, do not rebuild the whole plan. Use a short return note and restart from the next visible step.",
    },
    {
      title: "Best focus conditions",
      body: "Short focus blocks, visible next steps, fewer competing priorities, and a clear return point.",
    },
  ] satisfies readonly FocusPatternCard[],
} as const;

export const RETAKE_QUIZ = {
  title: POST_PURCHASE_SECTIONS.retake,
  body: "Your focus needs can change with workload, energy, routine, and stress. Retake the quiz anytime to update your plan.",
  cta: "Retake quiz",
} as const;

/** Lowercased terms that must never appear in post-purchase dashboard copy. */
export const FORBIDDEN_POST_PURCHASE_TERMS = [
  "script",
  "protocol",
  "cognitive signature",
  "neurotypical",
  "clinical",
  "diagnosis",
  "treatment",
  "disorder",
  "symptom",
  "brain process",
  "adhd",
] as const;

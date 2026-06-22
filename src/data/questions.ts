import { QuizQuestion } from "@/types/quiz";

/*
 * FULL FUNNEL — 15 quiz questions + info cards
 *
 * Copy is intentionally warm, short, and scannable (focus-friendly): titles
 * ~3-6 words, options under ~6 words, no multi-clause options. SCORING NOTE:
 * scoring/personalization reads ONLY question `id`s and option `id`s — never
 * the visible text. So every title/subtitle/label below is free to change as
 * long as the `id` fields stay stable. Reordering is also safe.
 *
 * INFO CARDS are purely presentational — `submitInfo` never writes to `answers`,
 * so info cards never affect scoring. They can be added, removed, reordered,
 * or reworded freely.
 *
 * 15-QUESTION CUT (funnel audit): gender, age, sleep, daily-impact, and
 * motivation were removed. None of them feed archetype selection
 * (signature.ts), answer echoes, or the focus-friction score
 * (symptom-level.ts). sleep/daily-impact only fed optional branches of the
 * dashboard's focusConditions, which fall back gracefully when the answers
 * are absent — and stored results that still contain them are simply ignored
 * by id-based readers, so old and new results both keep working.
 *
 * Block 1 — Pain hook (warm single-selects; paid traffic lands here),
 *           then info card 0 (acknowledgment).
 * Block 2 — Deeper pattern (history, goals, available time), then
 *           info card A (belonging).
 * Block 3 — Scale block (6 statements) with info card B (pattern tease)
 *           mid-block. All six are load-bearing: they drive the paid
 *           report's six-dimension radar, the snapshot score, and several
 *           archetype signals.
 * Block 4 — Context + readiness, then the snapshot card.
 *
 * Scored ids (do not rename): mood, distraction, experience, time, support,
 * obstacles, scale-*.
 * Personalization-only ids (labels free, ids kept stable): focus-feeling,
 * struggles, goals.
 */

export const questions: QuizQuestion[] = [

  /* ── BLOCK 1 — Pain hook ─────────────────────────────────────── */

  /* Q1 — Pain opener (personalization only; first screen for paid traffic) */
  {
    id: "focus-feeling",
    question: "What feels most true lately?",
    inputType: "single",
    options: [
      { id: "cant-start", label: "I can't get started." },
      { id: "stall",      label: "I stall halfway through." },
      { id: "heavy",      label: "Simple tasks feel heavy." },
      { id: "behind",     label: "I'm busy but behind." },
    ],
  },

  /* Q2 — mood (SCORED: recovery) */
  {
    id: "mood",
    question: "When your day goes off track, what usually happens?",
    inputType: "single",
    options: [
      { id: "never",     label: "I bounce back fast." },
      { id: "rarely",    label: "A quick reset works." },
      { id: "sometimes", label: "Depends on the load." },
      { id: "often",     label: "I stay off track a while." },
      { id: "always",    label: "Once derailed, I'm done." },
    ],
  },

  /* Q3 — distraction (SCORED: symptom score + recovery copy).
     Reduced to 3 frequency options (low/mid/high) to cut cognitive load and
     make this faster to answer. Option ids rarely/sometimes/often are kept, so
     SCORE_MAP (34/57/74 = low/mid/high) and the Drifter signature rule are
     unchanged; never/always stay valid stored values so older results still
     score and the scoring code needs no edit. */
  {
    id: "distraction",
    question: "How often does time vanish?",
    inputType: "single",
    options: [
      { id: "rarely",    label: "Rarely" },
      { id: "sometimes", label: "Sometimes" },
      { id: "often",     label: "Often" },
    ],
  },

  /* Q4 — struggles (personalization; strong "that's me" multi) */
  {
    id: "struggles",
    question: "Where does it fall apart?",
    inputType: "multiple",
    options: [
      { id: "anxiety",    label: "Starting feels too big." },
      { id: "depression", label: "I lose momentum fast." },
      { id: "burnout",    label: "Routines don't stick." },
      { id: "ocd",        label: "Details pile up." },
      { id: "other",      label: "Plans change and I lose the thread." },
      { id: "none",       label: "None of these." },
    ],
  },

  /* INFO CARD 0 — early acknowledgment (after the pain block) */
  {
    id: "info-seen",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Clarity for the next move",
    infoPattern:
      "Too many tasks and competing priorities can make the next step hard to spot.",
    infoConsequence:
      "Energy goes into deciding, reorganizing, and reconsidering instead of starting.",
    infoCapability:
      "FocusRoute turns competing priorities into a clear next action, so you spend less time deciding and more time moving forward.",
    infoBenefit:
      "Less decision load, a clearer next action.",
  },

  /* ── BLOCK 2 — Deeper pattern ────────────────────────────────── */

  /* Q5 — experience (SCORED: initiation style) */
  {
    id: "experience",
    question: "Tried fixing this before?",
    inputType: "single",
    options: [
      { id: "never", label: "Starting from scratch." },
      { id: "tried", label: "Tried, didn't stick." },
      { id: "yes",   label: "My routines don't fit." },
    ],
  },

  /* Q6 — goals (personalization) */
  {
    id: "goals",
    question: "What would feel like relief?",
    inputType: "multiple",
    options: [
      { id: "focus",      label: "Focus that holds." },
      { id: "memory",     label: "Not dropping details." },
      { id: "adhd",       label: "A system that fits me." },
      { id: "reasoning",  label: "Clear next steps." },
      { id: "stress",     label: "Less overwhelm." },
      { id: "creativity", label: "Finishing what I start." },
    ],
  },

  /* Q7 — time (SCORED: focus conditions) */
  {
    id: "time",
    question: "What feels realistic each day?",
    inputType: "single",
    options: [
      { id: "5min",  label: "5 min/day", badge: "Starter" },
      { id: "10min", label: "10 min/day", badge: "Consistent" },
      { id: "20min", label: "20 min/day", badge: "Committed" },
      { id: "30min", label: "30 min/day", badge: "Intensive" },
    ],
  },

  /* INFO CARD A — belonging (after the pattern block) */
  {
    id: "info-match",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Start without rebuilding the plan",
    infoHighlight: undefined,
    infoPattern:
      "Wanting to do a task does not always mean knowing where to begin.",
    infoConsequence:
      "The task stays stuck because the entry point still feels big or undefined.",
    infoCapability:
      "FocusRoute breaks priorities into clear daily actions, helping you start without rebuilding your entire plan.",
    infoBenefit:
      "You can begin from a concrete daily action, not a full planning reset.",
  },

  /* ── BLOCK 3 — Scale block (6 statements) ────────────────────── */

  /* Q8 */
  {
    id: "scale-procrastination",
    question: "How true is this for you?",
    inputType: "scale",
    options: [],
    statement: "I put off things I actually care about.",
  },

  /* Q9 */
  {
    id: "scale-focus",
    question: "How true is this for you?",
    inputType: "scale",
    options: [],
    statement: "Once it's boring, my focus is gone.",
  },

  /* Q10 */
  {
    id: "scale-overwhelm",
    question: "How true is this for you?",
    inputType: "scale",
    options: [],
    statement: "Too much at once and I freeze.",
  },

  /* INFO CARD B — pattern hint (breaks up the scale block) */
  {
    id: "info-focus",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Recover after interruptions",
    infoPattern:
      "An interruption can make the rest of the day lose direction.",
    infoConsequence:
      "Afterward, you rebuild context and decide again what deserves attention.",
    infoCapability:
      "FocusRoute helps you recover your route after interruptions and identify what deserves your attention next.",
    infoBenefit:
      "You return to the next priority faster, with less mental backtracking.",
  },

  /* Q11 */
  {
    id: "scale-organization",
    question: "Keep going — how true?",
    inputType: "scale",
    options: [],
    statement: "I know the goal, not the next step.",
  },

  /* Q12 */
  {
    id: "scale-memory",
    question: "How true is this for you?",
    inputType: "scale",
    options: [],
    statement: "If I don't write it down, it's gone.",
  },

  /* Q13 — last of the scale block (2 non-scale questions still follow) */
  {
    id: "scale-emotions",
    question: "Last pattern check.",
    inputType: "scale",
    options: [],
    statement: "A bad mood can wreck my whole day.",
  },

  /* ── BLOCK 4 — Context + readiness ───────────────────────────── */

  /* INFO CARD C - integrated system bridge (after the scale block) */
  {
    id: "info-system",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "A personalized system is taking shape",
    infoPattern:
      "Your answers point to connected focus patterns, not isolated task problems.",
    infoConsequence:
      "A plain task list would leave starts, resets, and progress disconnected.",
    infoCapability:
      "FocusRoute brings your priorities, daily actions, focus patterns and progress into one personalized system.",
    infoBenefit:
      "One route for what matters, how to start, how to recover, and how progress is moving.",
    infoClosing:
      "Not another generic to-do list. A clearer operating system for your day.",
  },

  /* Q14 — support (SCORED: focus conditions + initiation) */
  {
    id: "support",
    question: "What's in your corner?",
    inputType: "single",
    options: [
      { id: "therapy",    label: "A therapist." },
      { id: "psychiatry", label: "Medical support." },
      { id: "coaching",   label: "A coach or mentor." },
      { id: "none",       label: "Just me for now." },
    ],
  },

  /* Q15 — obstacles (SCORED: initiation style + archetypes) */
  {
    id: "obstacles",
    question: "What keeps breaking your streak?",
    inputType: "multiple",
    options: [
      { id: "consistency", label: "I can't keep it up." },
      { id: "motivation",  label: "Day-one energy fades." },
      { id: "time",        label: "Schedule's too chopped up." },
      { id: "method",      label: "I need a clearer plan." },
      { id: "distraction", label: "Too many distractions." },
    ],
  },

  /* Snapshot card (just before the result flow) — infoBody is a VARIANT KEY
     here, consumed by InfoCard.tsx. Do NOT change this infoBody value. */
  {
    id: "adhd-profile",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Here's your focus snapshot",
    infoBody: "adhd-profile",
  },
];

export const progressQuestions = questions.filter(
  (q) => q.inputType !== "info"
);

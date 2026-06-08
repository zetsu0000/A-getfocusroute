import { QuizQuestion } from "@/types/quiz";

/*
 * FULL FUNNEL — 21 quiz questions + info cards
 *
 * Copy is intentionally warm, short, and scannable (focus-friendly): titles
 * ~4-7 words, options under ~7 words, no multi-clause options. SCORING NOTE:
 * scoring/personalization reads ONLY question `id`s and option `id`s — never
 * the visible text. So every title/subtitle/label below is free to change as
 * long as the `id` fields stay stable. Reordering is also safe (the signature
 * hash sorts by questionId before hashing).
 *
 * Block 1 — Pain hook (warm single-selects; paid traffic lands here).
 * Block 2 — Quick setup (pronoun + age, once the user is invested).
 * Block 3 — Deeper pattern, then info card A.
 * Block 4 — Scale block (6 statements) with info cards B and C.
 * Block 5 — Context + readiness, then profile preview cards and paywall.
 *
 * Scored ids (do not rename): mood, distraction, sleep, experience,
 * daily-impact, time, support, obstacles, scale-*.
 * Hash-only ids (labels free, ids kept stable): focus-feeling, gender, age,
 * struggles, goals, diagnosis, motivation.
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
    question: "When your day gets derailed?",
    inputType: "single",
    options: [
      { id: "never",     label: "I bounce back fast." },
      { id: "rarely",    label: "A quick reset works." },
      { id: "sometimes", label: "Depends on the load." },
      { id: "often",     label: "I stay off track a while." },
      { id: "always",    label: "Once derailed, I'm done." },
    ],
  },

  /* Q3 — distraction (SCORED: symptom score + recovery copy) */
  {
    id: "distraction",
    question: "How often does time vanish?",
    inputType: "single",
    options: [
      { id: "never",     label: "Almost never." },
      { id: "rarely",    label: "Once in a while." },
      { id: "sometimes", label: "A few times a week." },
      { id: "often",     label: "Most days." },
      { id: "always",    label: "All day, every day." },
    ],
  },

  /* Q4 — struggles (hash-only; strong "that's me" multi) */
  {
    id: "struggles",
    question: "Where does it fall apart?",
    inputType: "multiple",
    options: [
      { id: "anxiety",    label: "Starting feels too big." },
      { id: "depression", label: "I lose momentum fast." },
      { id: "burnout",    label: "Routines don't stick." },
      { id: "ocd",        label: "Details pile up." },
      { id: "other",      label: "Plans change, I drop." },
      { id: "none",       label: "None of these." },
    ],
  },

  /* ── BLOCK 2 — Quick setup ───────────────────────────────────── */

  /* Q5 — pronoun (hash-only) */
  {
    id: "gender",
    question: "Quick setup before your results",
    subtitle: "What wording should we use?",
    inputType: "single",
    options: [
      { id: "male",   label: "He / him" },
      { id: "female", label: "She / her" },
      { id: "other",  label: "Keep it neutral" },
    ],
  },

  /* Q6 — age (hash-only) */
  {
    id: "age",
    question: "Your age range?",
    inputType: "single",
    options: [
      { id: "18-24", label: "18-24" },
      { id: "25-34", label: "25-34" },
      { id: "35-44", label: "35-44" },
      { id: "45-60", label: "45-60" },
      { id: "60+",   label: "60 or older" },
    ],
  },

  /* ── BLOCK 3 — Deeper pattern ────────────────────────────────── */

  /* Q7 — sleep (SCORED: focus conditions) */
  {
    id: "sleep",
    question: "How's your energy?",
    inputType: "single",
    options: [
      { id: "poor",   label: "It crashes a lot." },
      { id: "medium", label: "All over the place." },
      { id: "good",   label: "Mostly steady." },
      { id: "great",  label: "Pretty stable." },
    ],
  },

  /* Q8 — experience (SCORED: initiation style) */
  {
    id: "experience",
    question: "Tried fixing this before?",
    inputType: "single",
    options: [
      { id: "never", label: "Starting from scratch." },
      { id: "tried", label: "Tried, but it didn't stick." },
      { id: "yes",   label: "My routines don't fit." },
    ],
  },

  /* Q9 — daily-impact (SCORED: focus conditions) */
  {
    id: "daily-impact",
    question: "Where does it cost you most?",
    inputType: "multiple",
    options: [
      { id: "work",       label: "Work or studies" },
      { id: "relations",  label: "Relationships" },
      { id: "finances",   label: "Money and admin" },
      { id: "health",     label: "Health and self-care" },
      { id: "creativity", label: "Personal projects" },
    ],
  },

  /* Q10 — goals (hash-only) */
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

  /* Q11 — time (SCORED: focus conditions) */
  {
    id: "time",
    question: "How much time can you give?",
    inputType: "single",
    options: [
      { id: "5min",  label: "5 min/day", badge: "Starter" },
      { id: "10min", label: "10 min/day", badge: "Consistent" },
      { id: "20min", label: "20 min/day", badge: "Committed" },
      { id: "30min", label: "30 min/day", badge: "Intensive" },
    ],
  },

  /* INFO CARD A — after the pattern block */
  {
    id: "info-match",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "You're not broken — your focus just works differently.",
    infoHighlight: undefined,
    infoBody:
      "What you're describing is common. We'll build your plan around how your brain actually works.",
  },

  /* ── BLOCK 4 — Scale block (6 statements) ────────────────────── */

  /* Q12 */
  {
    id: "scale-procrastination",
    question: "How true is this for you?",
    inputType: "scale",
    options: [],
    statement: "I put off things I care about, even when I want to do them.",
  },

  /* Q13 */
  {
    id: "scale-focus",
    question: "And this one?",
    inputType: "scale",
    options: [],
    statement: "When something gets boring, my focus is gone.",
  },

  /* Q14 */
  {
    id: "scale-overwhelm",
    question: "This one?",
    inputType: "scale",
    options: [],
    statement: "Too much at once and I freeze instead of starting.",
  },

  /* INFO CARD B — after the first three statements */
  {
    id: "info-focus",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "The right small change can shift everything.",
    infoBody:
      "Small changes create the fastest momentum. Your plan starts with quick wins you can keep.",
  },

  /* Q15 */
  {
    id: "scale-organization",
    question: "Keep going — how true?",
    inputType: "scale",
    options: [],
    statement: "I know what I want to do, but not the next step.",
  },

  /* Q16 */
  {
    id: "scale-memory",
    question: "This one?",
    inputType: "scale",
    options: [],
    statement: "If I don't write it down, it's gone.",
  },

  /* Q17 */
  {
    id: "scale-emotions",
    question: "Last one — true for you?",
    inputType: "scale",
    options: [],
    statement: "A bad mood can wreck my whole day's work.",
  },

  /* INFO CARD C — after the scale block */
  {
    id: "info-adhd",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Most people only spot these patterns later in life.",
    infoBody:
      "These are patterns, not flaws. Your next steps fit how your brain works.",
  },

  /* ── BLOCK 5 — Context + readiness ───────────────────────────── */

  /* Q18 — diagnosis (hash-only) */
  {
    id: "diagnosis",
    question: "How well do you know your focus?",
    inputType: "single",
    options: [
      { id: "yes",       label: "I get it." },
      { id: "suspected", label: "Sort of — it's fuzzy." },
      { id: "no",        label: "Still figuring it out." },
    ],
  },

  /* Q19 — support (SCORED: focus conditions + initiation) */
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

  /* Q20 — obstacles (SCORED: initiation style) */
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

  /* Q21 — motivation (hash-only) */
  {
    id: "motivation",
    question: "Ready to see what fits?",
    inputType: "single",
    options: [
      { id: "very",   label: "Yes, starting today." },
      { id: "mostly", label: "Yes, if it's clear." },
      { id: "some",   label: "Almost — need small wins." },
      { id: "unsure", label: "Still exploring." },
    ],
  },

  /* Profile cards (just before email) — infoBody is a VARIANT KEY here,
     consumed by InfoCard.tsx. Do NOT change these two infoBody values. */
  {
    id: "adhd-profile",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Your FocusRoute Brain Profile preview is ready",
    infoBody: "adhd-profile",
  },

  {
    id: "brain-comparison",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Your Profile-to-Protocol preview is loading",
    infoBody: "brain-comparison",
  },
];

export const progressQuestions = questions.filter(
  (q) => q.inputType !== "info"
);

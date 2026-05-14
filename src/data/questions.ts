import { QuizQuestion } from "@/types/quiz";

/*
 * FULL FUNNEL — 20 quiz questions + info cards
 *
 * ┌─ BLOCK A: Regular style (Q1–Q10) ──────────────────────────┐
 * │  Q1  gender      → special landing screen                  │
 * │  Q2  age         single                                     │
 * │  Q3  mood        single                                     │
 * │  Q4  struggles   multiple                                   │
 * │  Q5  distraction single                                     │
 * │  Q6  goals       multiple                                   │
 * │  Q7  sleep       single                                     │
 * │  Q8  experience  single                                     │
 * │  Q9  daily-impact multiple                                  │
 * │  Q10 time        single                                     │
 * └─────────────────────────────────────────────────────────────┘
 *   → INFO CARD A  (after Q10)
 *
 * ┌─ BLOCK B: Emoji scale (Q11–Q16) ───────────────────────────┐
 * │  Q11 procrastination  scale                                 │
 * │  Q12 focus            scale                                 │
 * │  Q13 overwhelm        scale                                 │
 * └─────────────────────────────────────────────────────────────┘
 *   → INFO CARD B  (every 3 scale questions)
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Q14 organization     scale                                 │
 * │  Q15 memory           scale                                 │
 * │  Q16 emotions         scale                                 │
 * └─────────────────────────────────────────────────────────────┘
 *   → INFO CARD C  (every 3 scale questions)
 *
 * ┌─ BLOCK C: Regular style cont. (Q17–Q20) ────────────────────┐
 * │  Q17 diagnosis   single                                     │
 * │  Q18 support     single                                     │
 * │  Q19 obstacles   multiple                                   │
 * │  Q20 motivation  single                                     │
 * └─────────────────────────────────────────────────────────────┘
 *   → adhd-profile → brain-comparison → loading → email → paywall
 */

export const questions: QuizQuestion[] = [

  /* ═════════════ BLOCK A — Regular (Q1 – Q10) ═══════════════ */

  /* Q1 — Gender (rendered as GenderLanding, not a normal card) */
  {
    id: "gender",
    question: "What is your gender?",
    inputType: "single",
    options: [
      { id: "male",   label: "Male" },
      { id: "female", label: "Female" },
      { id: "other",  label: "Non-binary / Prefer not to say" },
    ],
  },

  /* Q2 */
  {
    id: "age",
    question: "What is your age range?",
    inputType: "single",
    options: [
      { id: "18-24", label: "18 – 24" },
      { id: "25-34", label: "25 – 34" },
      { id: "35-44", label: "35 – 44" },
      { id: "45-60", label: "45 – 60" },
      { id: "60+",   label: "60 or older" },
    ],
  },

  /* Q3 */
  {
    id: "mood",
    question: "How often do you experience sudden mood swings in a single day?",
    inputType: "single",
    options: [
      { id: "never",     label: "Never" },
      { id: "rarely",    label: "Rarely" },
      { id: "sometimes", label: "Sometimes" },
      { id: "often",     label: "Often" },
      { id: "always",    label: "Almost always" },
    ],
  },

  /* Q4 */
  {
    id: "struggles",
    question: "Have you ever faced any of these challenges?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "anxiety",    label: "Anxiety" },
      { id: "depression", label: "Depression" },
      { id: "burnout",    label: "Burnout" },
      { id: "ocd",        label: "Obsessive-compulsive disorder" },
      { id: "other",      label: "Other mental health issues" },
      { id: "none",       label: "None of the above" },
    ],
  },

  /* Q5 */
  {
    id: "distraction",
    question: "How often do you lose track of time?",
    inputType: "single",
    options: [
      { id: "never",     label: "Never" },
      { id: "rarely",    label: "Rarely" },
      { id: "sometimes", label: "Sometimes" },
      { id: "often",     label: "Often" },
      { id: "always",    label: "Almost always" },
    ],
  },

  /* Q6 */
  {
    id: "goals",
    question: "What do you want to improve?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "focus",      label: "Focus & Concentration" },
      { id: "memory",     label: "Memory" },
      { id: "adhd",       label: "Manage ADHD" },
      { id: "reasoning",  label: "Logical Reasoning" },
      { id: "stress",     label: "Reduce Mental Stress" },
      { id: "creativity", label: "Creativity" },
    ],
  },

  /* Q7 */
  {
    id: "sleep",
    question: "How would you rate your sleep quality?",
    inputType: "single",
    options: [
      { id: "poor",   label: "Poor – I sleep too little or poorly" },
      { id: "medium", label: "Fair – could be better" },
      { id: "good",   label: "Good – I sleep well most days" },
      { id: "great",  label: "Excellent" },
    ],
  },

  /* Q8 */
  {
    id: "experience",
    question: "Have you ever used a brain training app before?",
    inputType: "single",
    options: [
      { id: "never", label: "Never" },
      { id: "tried", label: "I tried, but didn't stick with it" },
      { id: "yes",   label: "Yes, I use one regularly" },
    ],
  },

  /* Q9 */
  {
    id: "daily-impact",
    question: "In which areas does ADHD impact your life the most?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "work",        label: "Work or studies" },
      { id: "relations",   label: "Relationships" },
      { id: "finances",    label: "Personal finances" },
      { id: "health",      label: "Health & self-care" },
      { id: "creativity",  label: "Personal projects / creativity" },
    ],
  },

  /* Q10 — last regular question */
  {
    id: "time",
    question: "How much time can you dedicate to self-development daily?",
    inputType: "single",
    options: [
      { id: "5min",  label: "5 min/day",  badge: "Casual" },
      { id: "10min", label: "10 min/day", badge: "Serious" },
      { id: "20min", label: "20 min/day", badge: "Ambitious" },
      { id: "30min", label: "30 min/day", badge: "Challenger" },
    ],
  },

  /* ─── INFO CARD A — after Q10 ──────────────────────────────── */
  {
    id: "info-match",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "You're not alone!",
    infoHighlight: undefined,
    infoBody: "Many of our users faced the same challenges before trying the program. Let's personalize your plan now.",
  },

  /* ═════════════ BLOCK B — Emoji Scale (Q11 – Q16) ══════════ */

  /* Q11 */
  {
    id: "scale-procrastination",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I tend to procrastinate or delay starting tasks and activities.",
  },

  /* Q12 */
  {
    id: "scale-focus",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I have difficulty maintaining focus on a task for more than 20 minutes.",
  },

  /* Q13 */
  {
    id: "scale-overwhelm",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I often feel overwhelmed by my day-to-day responsibilities.",
  },

  /* ─── INFO CARD B — after Q13 (every 3 scale questions) ────── */
  {
    id: "info-focus",
    question: "",
    inputType: "info",
    options: [],
    infoEmoji: "🧘",
    infoStat: "Focus is the key to managing ADHD — and we know how to build it",
    infoBody:
      "74% of our users felt more focused after just one week of training (internal research, 2,040 participants, July 2024).",
  },

  /* Q14 */
  {
    id: "scale-organization",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I have difficulty organizing my thoughts and planning my tasks.",
  },

  /* Q15 */
  {
    id: "scale-memory",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I frequently forget important commitments or misplace objects.",
  },

  /* Q16 */
  {
    id: "scale-emotions",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "My emotions significantly affect my productivity and decision-making.",
  },

  /* ─── INFO CARD C — after Q16 (every 3 scale questions) ────── */
  {
    id: "info-adhd",
    question: "",
    inputType: "info",
    options: [],
    infoEmoji: "💡",
    infoStat: "46% of our users first noticed ADHD symptoms in adulthood",
    infoBody:
      "ADHD is not just a childhood condition — it can affect anyone at any stage of life.",
  },

  /* ═════════════ BLOCK C — Regular cont. (Q17 – Q20) ════════ */

  /* Q17 */
  {
    id: "diagnosis",
    question: "Have you ever been diagnosed with ADHD?",
    inputType: "single",
    options: [
      { id: "yes",       label: "Yes, I have a formal diagnosis" },
      { id: "suspected", label: "I suspect I do, but I've never been evaluated" },
      { id: "no",        label: "No, but I identify with some symptoms" },
    ],
  },

  /* Q18 */
  {
    id: "support",
    question: "Do you currently have any kind of professional support?",
    inputType: "single",
    options: [
      { id: "therapy",    label: "Psychologist / therapist" },
      { id: "psychiatry", label: "Psychiatrist / medication" },
      { id: "coaching",   label: "Coach or mentor" },
      { id: "none",       label: "None at the moment" },
    ],
  },

  /* Q19 */
  {
    id: "obstacles",
    question: "What is holding you back the most?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "consistency", label: "Lack of consistency" },
      { id: "motivation",  label: "Lack of motivation" },
      { id: "time",        label: "Lack of time" },
      { id: "method",      label: "I don't know where to start" },
      { id: "distraction", label: "Too many distractions" },
    ],
  },

  /* Q20 */
  {
    id: "motivation",
    question: "How do you feel about changing your habits right now?",
    inputType: "single",
    options: [
      { id: "very",    label: "Very motivated — I want to start today!" },
      { id: "mostly",  label: "Quite motivated — I just need a little push" },
      { id: "some",    label: "Somewhat motivated — still hesitant" },
      { id: "unsure",  label: "I'm not sure yet" },
    ],
  },

  /* ─── Profile cards (just before email) ────────────────────── */
  {
    id: "adhd-profile",
    question: "",
    inputType: "info",
    options: [],
    infoEmoji: "🧠",
    infoStat: "Your ADHD Profile",
    infoBody: "adhd-profile",
  },

  {
    id: "brain-comparison",
    question: "",
    inputType: "info",
    options: [],
    infoEmoji: "✨",
    infoStat: "brain-comparison",
    infoBody: "brain-comparison",
  },
];

export const progressQuestions = questions.filter(
  (q) => q.inputType !== "info"
);

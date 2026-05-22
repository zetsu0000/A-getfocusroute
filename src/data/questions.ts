import { QuizQuestion } from "@/types/quiz";

/*
 * FULL FUNNEL - 20 quiz questions + info cards
 *
 * Block A: regular questions Q1-Q10, then info card A.
 * Block B: scale questions Q11-Q16, with info cards after each group of 3.
 * Block C: regular questions Q17-Q20, then profile preview cards and paywall.
 */

export const questions: QuizQuestion[] = [

  /* BLOCK A - Regular (Q1-Q10) */

  /* Q1 - Profile context */
  {
    id: "gender",
    question: "Choose the version that fits your context.",
    subtitle: "This only helps tailor the language in your report.",
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
      { id: "18-24", label: "18-24" },
      { id: "25-34", label: "25-34" },
      { id: "35-44", label: "35-44" },
      { id: "45-60", label: "45-60" },
      { id: "60+",   label: "60 or older" },
    ],
  },

  /* Q3 */
  {
    id: "mood",
    question: "When your day gets disrupted, how quickly do you recover your focus?",
    inputType: "single",
    options: [
      { id: "never", label: "I recover quickly most days" },
      { id: "rarely", label: "I usually recover with a short reset" },
      { id: "sometimes", label: "It depends on how much is on my plate" },
      { id: "often", label: "I often stay off track longer than I want" },
      { id: "always", label: "I struggle to recover once derailed" },
    ],
  },

  /* Q4 */
  {
    id: "struggles",
    question: "Where does focus usually get stuck for you?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "anxiety", label: "Starting tasks when the stakes feel high" },
      { id: "depression", label: "Following through after the first burst" },
      { id: "burnout", label: "Keeping plans organized through the week" },
      { id: "ocd", label: "Remembering details without feeling overloaded" },
      { id: "other", label: "Staying steady when plans change" },
      { id: "none", label: "None of these right now" },
    ],
  },

  /* Q5 */
  {
    id: "distraction",
    question: "How often does time slip away when you switch tasks?",
    inputType: "single",
    options: [
      { id: "never", label: "Almost never" },
      { id: "rarely", label: "Occasionally" },
      { id: "sometimes", label: "A few times each week" },
      { id: "often", label: "Most days" },
      { id: "always", label: "Multiple times every day" },
    ],
  },

  /* Q6 */
  {
    id: "goals",
    question: "What outcomes matter most right now?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "focus", label: "More consistent focus blocks" },
      { id: "memory", label: "Better working memory in daily tasks" },
      { id: "adhd", label: "A system that fits my focus-pattern style" },
      { id: "reasoning", label: "Cleaner task prioritization" },
      { id: "stress", label: "Less overwhelm and faster resets" },
      { id: "creativity", label: "Finishing what I start" },
    ],
  },

  /* Q7 */
  {
    id: "sleep",
    question: "How does your energy curve affect your execution?",
    inputType: "single",
    options: [
      { id: "poor", label: "My energy crashes and disrupts plans" },
      { id: "medium", label: "Inconsistent energy makes routines hard" },
      { id: "good", label: "Mostly stable, with occasional dips" },
      { id: "great", label: "Stable energy supports my routines" },
    ],
  },

  /* Q8 */
  {
    id: "experience",
    question: "Which support format have you used before?",
    inputType: "single",
    options: [
      { id: "never", label: "I am starting from scratch" },
      { id: "tried", label: "I tried systems but could not sustain them" },
      { id: "yes", label: "I use routines, but want better fit" },
    ],
  },

  /* Q9 */
  {
    id: "daily-impact",
    question: "Where do focus-pattern challenges show up the most?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "work", label: "Work or studies" },
      { id: "relations", label: "Relationships and communication" },
      { id: "finances", label: "Money and admin responsibilities" },
      { id: "health", label: "Health and self-care routines" },
      { id: "creativity", label: "Personal projects and goals" },
    ],
  },

  /* Q10 - last regular question */
  {
    id: "time",
    question: "How much focused implementation time can you commit daily?",
    inputType: "single",
    options: [
      { id: "5min", label: "5 min/day", badge: "Starter" },
      { id: "10min", label: "10 min/day", badge: "Consistent" },
      { id: "20min", label: "20 min/day", badge: "Committed" },
      { id: "30min", label: "30 min/day", badge: "Intensive" },
    ],
  },

  /* INFO CARD A - after Q10 */
  {
    id: "info-match",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "You're not alone!",
    infoHighlight: undefined,
    infoBody:
      "Executive-function friction is common. We use your answers to build a profile-first plan instead of generic advice.",
  },

  /* BLOCK B - Scale (Q11-Q16) */

  /* Q11 */
  {
    id: "scale-procrastination",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I delay starting important tasks, even when I care about the outcome.",
  },

  /* Q12 */
  {
    id: "scale-focus",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "My focus drops quickly when a task is repetitive or low-stimulation.",
  },

  /* Q13 */
  {
    id: "scale-overwhelm",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I feel overloaded when multiple priorities compete at once.",
  },

  /* INFO CARD B - after Q13 */
  {
    id: "info-focus",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Your focus consistency can improve with the right operating system",
    infoBody:
      "Small implementation shifts often create early momentum. Your protocol will prioritize fast wins you can sustain.",
  },

  /* Q14 */
  {
    id: "scale-organization",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I struggle to translate plans into a clear next action.",
  },

  /* Q15 */
  {
    id: "scale-memory",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "I lose track of details unless I externalize them quickly.",
  },

  /* Q16 */
  {
    id: "scale-emotions",
    question: "Do you agree with the statement below?",
    inputType: "scale",
    options: [],
    statement: "Emotional intensity can derail my task flow and decision-making.",
  },

  /* INFO CARD C - after Q16 */
  {
    id: "info-adhd",
    question: "",
    inputType: "info",
    options: [],
    infoStat: "Many people discover these patterns later in life",
    infoBody:
      "Your profile maps patterns, not personality flaws. We design your next steps around how your brain works.",
  },

  /* BLOCK C - Regular continued (Q17-Q20) */

  /* Q17 */
  {
    id: "diagnosis",
    question: "How would you describe your current focus-pattern context?",
    inputType: "single",
    options: [
      { id: "yes", label: "I have formal context for these patterns" },
      { id: "suspected", label: "I strongly relate to focus-pattern friction" },
      { id: "no", label: "I am exploring focus and execution patterns" },
    ],
  },

  /* Q18 */
  {
    id: "support",
    question: "What support do you currently use?",
    inputType: "single",
    options: [
      { id: "therapy", label: "Therapist or counselor" },
      { id: "psychiatry", label: "Medical support / medication management" },
      { id: "coaching", label: "Coach, mentor, or accountability partner" },
      { id: "none", label: "No formal support right now" },
    ],
  },

  /* Q19 */
  {
    id: "obstacles",
    question: "What blocks consistency the most right now?",
    subtitle: "Select all that apply.",
    inputType: "multiple",
    options: [
      { id: "consistency", label: "I cannot maintain routines" },
      { id: "motivation", label: "I lose momentum after day one" },
      { id: "time", label: "My schedule feels too fragmented" },
      { id: "method", label: "I need a clearer protocol" },
      { id: "distraction", label: "Context switching and distractions" },
    ],
  },

  /* Q20 */
  {
    id: "motivation",
    question: "How ready are you to implement a profile-based plan now?",
    inputType: "single",
    options: [
      { id: "very", label: "Ready now. I want to start today." },
      { id: "mostly", label: "Ready with a clear step-by-step system." },
      { id: "some", label: "Cautiously ready; I need small wins first." },
      { id: "unsure", label: "I am still exploring what will fit." },
    ],
  },

  /* Profile cards (just before email) */
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

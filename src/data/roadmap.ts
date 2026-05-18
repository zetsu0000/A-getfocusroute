/**
 * 28-Day Protocol — structured daily support (educational / practical, not clinical).
 * Copy is calm, premium, and ADHD-friendly: small steps, low shame, clear exits.
 */

export type RoadmapDay = {
  day: number;
  title: string;
  objective: string;
  microAction: string;
  whyItWorks: string;
  estimatedTime: string;
  reflectionPrompt: string;
};

const RAW: Omit<RoadmapDay, "day">[] = [
  {
    title: "Choose one lane, gently",
    objective:
      "Quiet background noise by naming a single focus lane for the next week—not a life overhaul, just a direction.",
    microAction:
      "List four possible lanes (work project, home reset, health rhythm, admin catch-up). Circle the one that would remove the most mental static if it moved a little.",
    whyItWorks:
      "When attention has many equal-weight options, starting feels expensive. One lane lowers the activation cost without trapping you forever.",
    estimatedTime: "10–15 min",
    reflectionPrompt:
      "Did you choose quickly, stall, or negotiate? What would “good enough for seven days” look like here?",
  },
  {
    title: "Make the first step embarrassingly small",
    objective:
      "Turn your lane into a first move so tiny it cannot argue with you.",
    microAction:
      "Write the real outcome you want, then rewrite it as a 2-minute version (open doc, lay out shoes, find one file). Schedule it for today.",
    whyItWorks:
      "Tiny starts bypass the brain’s threat response to big vague tasks; you can always add more after the door is open.",
    estimatedTime: "8–12 min",
    reflectionPrompt:
      "What part of you resisted shrinking the step—and what happens if you treat that resistance as information, not failure?",
  },
  {
    title: "Design your default environment",
    objective:
      "Reduce friction before you need willpower: one visible cue, one hidden distraction.",
    microAction:
      "Pick your primary workspace. Add one cue (notebook open, tab pinned). Remove or relocate one common trap (phone across the room, noisy tab closed).",
    whyItWorks:
      "Environment design shifts load off working memory; fewer micro-decisions preserves energy for the actual task.",
    estimatedTime: "12–18 min",
    reflectionPrompt:
      "Which change felt relieving versus annoying? What does that tell you about how you actually focus?",
  },
  {
    title: "Anchor with a two-minute arrival ritual",
    objective:
      "Train transitions so your nervous system knows “we are starting now,” without drama.",
    microAction:
      "Before your next focus block: water, one deep breath, one sentence on paper: “I am starting with ___.” Begin the timer.",
    whyItWorks:
      "Predictable micro-rituals reduce switch cost between modes (rest ↔ work ↔ social).",
    estimatedTime: "5–10 min",
    reflectionPrompt:
      "Did the ritual feel silly, grounding, or neutral? What would make it feel 10% more yours?",
  },
  {
    title: "Name your top three distractions",
    objective:
      "Externalize what steals attention so it stops looping in the background.",
    microAction:
      "Write three distraction themes (notifications, internal chatter, household pulls). Pick one you will interrupt tomorrow with a single rule.",
    whyItWorks:
      "Naming patterns lowers rumination and makes interventions specific instead of moral (“I should focus”).",
    estimatedTime: "10–14 min",
    reflectionPrompt:
      "Which distraction is mostly environmental versus emotional? What boundary fits without perfection?",
  },
  {
    title: "Build a “good enough” finish line",
    objective:
      "Prevent endless polishing by defining what “done for today” means before you begin.",
    microAction:
      "For your lane task, write: Done = (three bullets max). When you hit them, close with a one-line win note.",
    whyItWorks:
      "Clear finish lines reduce all-or-nothing spirals and protect dopamine from chasing infinite improvement.",
    estimatedTime: "8–12 min",
    reflectionPrompt:
      "Where do you usually overshoot “done”? What would honoring a finish line give you back tonight?",
  },
  {
    title: "Energy map, not a productivity score",
    objective:
      "Notice when you focus best this week—without grading yourself.",
    microAction:
      "Sketch three time windows (morning / midday / evening). Place one check where focus felt easiest and one dot where it felt hardest—no reasons required yet.",
    whyItWorks:
      "Self-mapping builds agency; shame-based tracking tends to backfire for many ADHD brains.",
    estimatedTime: "10–15 min",
    reflectionPrompt:
      "If you respected your hardest window instead of fighting it, what would shift in how you schedule hard tasks?",
  },
  {
    title: "One inbox, one outbox",
    objective:
      "Stop ideas from evaporating and tasks from multiplying across surfaces.",
    microAction:
      "Choose one capture tool (paper, notes app). For 24 hours, every stray thought goes there—nothing else. End of day: triage into three buckets: do / later / delete.",
    whyItWorks:
      "Single capture reduces split attention and the anxiety of “I will forget this.”",
    estimatedTime: "12–20 min",
    reflectionPrompt:
      "What did you resist capturing—and what does that reveal about fear of commitment or fear of forgetting?",
  },
  {
    title: "Pair a dreaded task with a pleasant anchor",
    objective:
      "Lower activation dread using a humane pairing, not punishment.",
    microAction:
      "Pick one mildly dreaded admin task. Pair it with tea, sunlight, favorite playlist, or standing at the counter—keep the pairing consistent this week.",
    whyItWorks:
      "Associative cues can make approach easier; the anchor becomes a bridge, not a bribe.",
    estimatedTime: "15–25 min",
    reflectionPrompt:
      "Did the pairing change the story you tell about the task? What story would you prefer?",
  },
  {
    title: "Body-first reset (no equipment)",
    objective:
      "Use movement and posture to shift state before cognitive work.",
    microAction:
      "Two minutes: roll shoulders, unclench jaw, stretch spine, shake hands. Then one sentence: “I am allowed to begin imperfectly.”",
    whyItWorks:
      "Regulation supports executive function; small somatic resets can be faster than “try harder.”",
    estimatedTime: "5–8 min",
    reflectionPrompt:
      "Where do you hold stress physically—and what would a 30-second version of this reset look like on a busy day?",
  },
  {
    title: "Time-box with a visible timer",
    objective:
      "Create a bounded container so your brain can trust there is an exit.",
    microAction:
      "Set an 18-minute block on one task. When the timer ends, choose: extend once, switch, or stop—write the choice explicitly.",
    whyItWorks:
      "Time boundaries reduce horizon anxiety and make breaks legitimate instead of “quitting.”",
    estimatedTime: "20–28 min",
    reflectionPrompt:
      "Did the exit option make starting easier? What duration felt honest, not heroic?",
  },
  {
    title: "Single-tab focus sprint",
    objective:
      "Practice one-window depth in a world designed for tabs.",
    microAction:
      "For one sprint: one browser window, one doc, one task. Everything else gets a sticky note “later” list—not solved now.",
    whyItWorks:
      "Tab switching is expensive; a temporary mono-channel reduces split-brain drag.",
    estimatedTime: "18–25 min",
    reflectionPrompt:
      "What did you want to open “just to check”? Can you ritualize that urge into a scheduled check instead?",
  },
  {
    title: "Plan for interruption, not perfection",
    objective:
      "Expect two interruptions and pre-decide recovery—so surprises feel normal.",
    microAction:
      "Before a focus block, write: If interrupted, I will ___ (three breaths / note where I stopped / set a 3-minute restart).",
    whyItWorks:
      "Pre-deciding recovery reduces the shame spiral that makes returning harder than the interruption itself.",
    estimatedTime: "8–12 min",
    reflectionPrompt:
      "Which recovery step is realistic on your worst day? How can you keep it that small?",
  },
  {
    title: "Shutdown list (close the open loops)",
    objective:
      "End the day with a gentle closure ritual so your mind can rest.",
    microAction:
      "Write: Tomorrow’s first step (one line), one worry parked on paper, one appreciation (small). Close the notebook.",
    whyItWorks:
      "Open loops create nighttime rumination; externalizing them signals safety to downshift.",
    estimatedTime: "10–15 min",
    reflectionPrompt:
      "What loop keeps replaying at night—and what would “enough closure for today” look like?",
  },
  {
    title: "Clarify the next physical action",
    objective:
      "Replace abstract intent with the next move your hands can do.",
    microAction:
      "Take your top task. Rewrite it starting with a verb + object + location (e.g., “Open laptop → downloads folder → rename file X”).",
    whyItWorks:
      "Concrete motor language reduces ambiguity, which is often what blocks initiation.",
    estimatedTime: "10–14 min",
    reflectionPrompt:
      "Where did language stay vague? What happens if you make the next action even more physical?",
  },
  {
    title: "Two-minute pre-mortem",
    objective:
      "Surface predictable friction without catastrophizing—so you can plan kindly.",
    microAction:
      "Ask: What usually derails this task? Write two likely bumps and one tiny prevention for each.",
    whyItWorks:
      "Anticipating friction with compassion beats surprise shame when the bump appears.",
    estimatedTime: "8–12 min",
    reflectionPrompt:
      "Which prevention felt doable versus performative? Keep the doable one.",
  },
  {
    title: "Batch similar micro-tasks",
    objective:
      "Reduce context switching by grouping shallow work into one container.",
    microAction:
      "Collect 5–10 micro-tasks (emails, forms, quick replies). Do them in one 25-minute playlist block—then stop.",
    whyItWorks:
      "Batching uses one activation cost for many small completions, which can restore a sense of momentum.",
    estimatedTime: "25–35 min",
    reflectionPrompt:
      "Did batching feel clarifying or draining? What batch size matches your real capacity?",
  },
  {
    title: "Create a “resume packet” for future-you",
    objective:
      "Make restarting cheap after you inevitably pause.",
    microAction:
      "On a sticky note: last completed step, next step, file links. Place it where you will see it first tomorrow.",
    whyItWorks:
      "Future-you inherits context without re-scanning the whole project mentally.",
    estimatedTime: "6–10 min",
    reflectionPrompt:
      "What information did you almost skip writing down because it felt obvious—and would it still be obvious tomorrow?",
  },
  {
    title: "Lower the quality bar on purpose",
    objective:
      "Practice output that is coherent, not flawless—especially on first passes.",
    microAction:
      "Set a rule for today’s draft: “No editing until word count / checklist hits X.” Pick X that feels almost too easy.",
    whyItWorks:
      "Perfectionism often masks initiation fear; a temporary quality floor can unlock motion.",
    estimatedTime: "20–40 min",
    reflectionPrompt:
      "What scared you about releasing control? What did you gain anyway?",
  },
  {
    title: "Schedule a compassionate buffer",
    objective:
      "Stop planning back-to-back as if transitions cost zero.",
    microAction:
      "Add 10–15 minutes between two commitments today. Use buffer for water, walk, or quiet—no optimization required.",
    whyItWorks:
      "Buffers reduce time blindness whiplash and make you less likely to abandon the next block entirely.",
    estimatedTime: "5 min planning + buffer",
    reflectionPrompt:
      "Where did the buffer save you? Where did guilt try to steal it—and what would you say to that voice?",
  },
  {
    title: "One accountability text",
    objective:
      "Borrow social gravity without turning your life into a performance.",
    microAction:
      "Send one message: “Starting X at :__. Will ping when done for 25.” Keep it simple—no essay.",
    whyItWorks:
      "Lightweight externalization can raise follow-through without heavy coordination.",
    estimatedTime: "5–8 min",
    reflectionPrompt:
      "Who feels safe to be imperfect with? What boundary keeps this supportive, not stressful?",
  },
  {
    title: "Review wins without metrics theater",
    objective:
      "Collect evidence of motion so your brain updates its self-story.",
    microAction:
      "List seven micro-wins from the last two weeks (even “showed up,” “asked for help,” “closed laptop on time”).",
    whyItWorks:
      "ADHD narratives often overweight misses; intentional win collection restores proportion.",
    estimatedTime: "12–18 min",
    reflectionPrompt:
      "Which win surprised you? What does that reveal about what you actually value?",
  },
  {
    title: "Simplify your next week’s lane",
    objective:
      "Carry forward momentum by narrowing again—on purpose.",
    microAction:
      "Rewrite your lane as one sentence outcome + one weekly theme (e.g., “Clarity: reduce digital clutter in workspace”).",
    whyItWorks:
      "Re-narrowing prevents drift into heroic multitasking as confidence returns.",
    estimatedTime: "10–15 min",
    reflectionPrompt:
      "What did you try to add that you can postpone without catastrophe? What stays because it truly matters?",
  },
  {
    title: "Design a gentle weekly reset",
    objective:
      "Create a repeatable Sunday-or-Monday ritual that feels like care, not audit.",
    microAction:
      "Choose three steps max: clear surfaces, calendar scan, pick three priorities. Put on a calming timer and stop when it ends.",
    whyItWorks:
      "Predictable resets reduce Monday panic and scattered catch-up mode.",
    estimatedTime: "25–40 min",
    reflectionPrompt:
      "What step felt nourishing versus nagging? Trim to the nourishing core.",
  },
  {
    title: "Repair after a hard day—fast",
    objective:
      "Practice returning without a full postmortem when energy is low.",
    microAction:
      "If today derailed: write one line cause (sleep/human stuff/overwhelm), one repair (sleep/water/message), one tomorrow starter.",
    whyItWorks:
      "Short repair loops prevent multi-day collapses driven by shame, not capacity.",
    estimatedTime: "6–10 min",
    reflectionPrompt:
      "What would “repair” look like if you refused to earn rest first?",
  },
  {
    title: "Choose a maintenance mode",
    objective:
      "Acknowledge not every week is a growth week—some are stability weeks.",
    microAction:
      "Label this week: Build / Maintain / Recover. Pick one action that fits the label honestly.",
    whyItWorks:
      "Permission structures reduce self-punishment cycles that burn extra fuel.",
    estimatedTime: "8–12 min",
    reflectionPrompt:
      "If you chose Recover, what support would make recovery feel legitimate in your own eyes?",
  },
  {
    title: "Upgrade one system, not ten",
    objective:
      "Pick a single recurring friction point and improve it slightly.",
    microAction:
      "Choose: mornings, email, meal rhythm, or bedtime wind-down. Implement one tiny rule you can keep for 14 days.",
    whyItWorks:
      "Sustainable change prefers one stable lever over a burst of ten apps and habits.",
    estimatedTime: "15–25 min",
    reflectionPrompt:
      "What system did you choose because it’s truly loud—or because it looks impressive?",
  },
  {
    title: "Close the 28-day loop with a calm plan",
    objective:
      "Translate insights into a next-cycle plan without forcing a new hero arc.",
    microAction:
      "Pick one habit to keep, one to tweak, one to drop. Schedule a calendar reminder in 14 days to revisit—nothing else required today.",
    whyItWorks:
      "Gentle closure prevents the common crash after structured programs; a light revisit keeps continuity.",
    estimatedTime: "15–22 min",
    reflectionPrompt:
      "What changed in how you talk to yourself during friction? What phrase do you want to keep?",
  },
];

export const ROADMAP_DAYS: RoadmapDay[] = RAW.map((row, i) => ({
  day: i + 1,
  ...row,
}));

export const ROADMAP_WEEKS: { week: number; label: string; days: number[] }[] = [
  { week: 1, label: "Stabilize & reduce friction", days: [1, 2, 3, 4, 5, 6, 7] },
  { week: 2, label: "Environment & attention anchors", days: [8, 9, 10, 11, 12, 13, 14] },
  { week: 3, label: "Execution loops & recovery", days: [15, 16, 17, 18, 19, 20, 21] },
  { week: 4, label: "Consolidate & sustain", days: [22, 23, 24, 25, 26, 27, 28] },
];

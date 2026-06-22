/**
 * Dashboard bonus library — practical, non-clinical support copy.
 * Not a substitute for professional care; framed as personal organization and communication aids.
 */

export type ExplainScriptBlock = {
  heading: string;
  paragraphs: string[];
};

export type ExplainScriptBundle = {
  title: string;
  subtitle: string;
  /** Opening line(s) for copy — includes the focus-pattern label when `signatureName` is provided. */
  opener: string;
  openerFollowUp: string;
  blocks: ExplainScriptBlock[];
  footerNote: string;
};

/**
 * Builds the Explain My Focus Pattern note with optional FocusRoute focus-pattern label from saved quiz results.
 */
export function getExplainScriptBundle(
  signatureName: string | null | undefined,
): ExplainScriptBundle {
  const sig = typeof signatureName === "string" ? signatureName.trim() : "";
  const opener = sig
    ? `My FocusRoute profile says I'm a ${sig}. That means…`
    : `My FocusRoute profile maps how I focus and follow through. That means…`;

  const openerFollowUp = sig
    ? `The label is a pattern shorthand from my self-reported answers—not a medical label. It helps me describe momentum, friction, and recovery in plain language.`
    : `The map is built from my self-reported answers—not a medical label. It still helps me describe momentum, friction, and recovery in plain language.`;

  const sigParagraph = sig
    ? `When I say I'm a ${sig}, I'm naming a tendency pattern I recognize in myself—how I start, stall, recover, and re-focus—not a fixed identity.`
    : `When I talk about my profile, I'm naming tendencies I recognize in myself—how I start, stall, recover, and re-focus—not a fixed identity.`;

  return {
    title: "Explain My Focus Pattern",
    subtitle:
      "A calm template for describing how you handle focus and follow-through—without debating, over-explaining, or asking anyone to read your mind.",
    opener,
    openerFollowUp,
    blocks: [
      {
        heading: "What it feels like on the inside",
        paragraphs: [
          sigParagraph,
          "Sometimes my attention doesn't arrive on demand, even when I care deeply. Starting can feel heavy if the first step is fuzzy, or if too many equal-priority options compete at once.",
          "When I do lock in, I can move fast—but switching tasks has a real cost. Rapid context-switching drains me faster than it looks from the outside.",
        ],
      },
      {
        heading: "What helps me show up reliably",
        paragraphs: [
          "Small clarity up front helps more than pressure: a defined first action, a visible finish line, and a time boundary I can trust.",
          "Written capture and gentle transitions (a two-minute arrival ritual, a shutdown note for tomorrow) help me keep the thread between sessions.",
        ],
      },
      {
        heading: "What I'm asking for",
        paragraphs: [
          "If we're planning together, I do best with one primary lane at a time, realistic buffers, and explicit 'done for today' criteria.",
          "If you notice me drifting, a neutral nudge works better than shame—something like: 'What's the next physical step?' or 'Want to time-box 15 minutes?'",
        ],
      },
      {
        heading: "What I'm not saying",
        paragraphs: [
          "I'm not asking you to manage me. I'm asking for a partnership style that matches how I actually sustain effort—steady, humane, and practical.",
        ],
      },
    ],
    footerNote:
      "Adapt the wording to your relationship (manager, partner, roommate, collaborator). Keep it short; you can always offer a follow-up conversation later.",
  };
}

export type ToolkitItem = {
  id: string;
  title: string;
  tagline: string;
  purpose: string;
  howToUse: string;
  /** Plain text to copy into notes, Docs, or paper. */
  templateText: string;
};

export const ADHD_TOOLKIT_ITEMS: ToolkitItem[] = [
  {
    id: "daily-sprint-planner",
    title: "Daily Sprint Planner",
    tagline: "One lane. One timer. One dignified finish line.",
    purpose:
      "Turns a scattered day into a small number of bounded sprints so starting costs less and stopping feels legitimate.",
    howToUse:
      "Morning (or whenever you begin): write one lane, two must-dos, and one 'nice if.' For each must-do, define a 12–25 minute sprint with a visible timer and a written 'done' test before you start.",
    templateText: `DAILY SPRINT PLANNER — [Date: ___________]

LANE (one sentence):
_____________________________________________________

MUST-DO A — Done test (what proves it's done today?):
_____________________________________________________
Timer: [  ] 12 min   [  ] 18 min   [  ] 25 min

MUST-DO B — Done test:
_____________________________________________________
Timer: [  ] 12 min   [  ] 18 min   [  ] 25 min

NICE IF (optional, only if energy remains):
_____________________________________________________

BUFFER (minutes between commitments): _____

ENERGY NOTE (optional, one line):
_____________________________________________________

CLOSE: One win line + tomorrow's first physical step:
_____________________________________________________`,
  },
  {
    id: "brain-dump-converter",
    title: "Brain Dump Converter",
    tagline: "From mental static to three buckets—without losing nuance.",
    purpose:
      "Captures everything circling in your head, then sorts it so your brain can downshift instead of rehearsing the same loops.",
    howToUse:
      "Set a 6-minute timer. Dump freely. Then convert each line into exactly one of: Do (this week) / Later (dated) / Delete (kindly). If you can't decide, default to Later with a date you may change.",
    templateText: `BRAIN DUMP CONVERTER — [Date: ___________]
Timer: 6 minutes → sort → stop.

RAW DUMP (uncensored):
_____________________________________________________
_____________________________________________________
_____________________________________________________
_____________________________________________________

DO (this week — max 7 lines):
• _________________________________________________
• _________________________________________________

LATER (must include a date):
• ________________________________  date: _________
• ________________________________  date: _________

DELETE / NOT NOW (kind release):
• _________________________________________________

ONE LINE CALM-DOWN FOR MY BRAIN:
_____________________________________________________`,
  },
  {
    id: "weekly-reset-ritual",
    title: "Weekly Reset Ritual",
    tagline: "A soft landing for your week—not a performance review.",
    purpose:
      "Creates a repeatable closure and opening rhythm so Monday feels less like a cold start.",
    howToUse:
      "Choose three steps only: (1) surface reset, (2) calendar truth scan, (3) three priorities for the week ahead—each with a first physical step. Stop when the timer ends; trust 'enough.'",
    templateText: `WEEKLY RESET — Week of [___________]

1) SURFACE RESET (5–10 min)
What I cleared / reset: _____________________________

2) CALENDAR TRUTH SCAN (10 min)
Hard truth I need to own: ___________________________
One thing I will move to a humane slot: _______________

3) THREE PRIORITIES (names only)
1) __________________  first physical step: ___________
2) __________________  first physical step: ___________
3) __________________  first physical step: ___________

ONE KINDNESS I'LL KEEP NEXT WEEK:
_____________________________________________________

CLOSURE LINE (say aloud):
"This week has enough of a plan. I'm allowed to begin imperfectly."`,
  },
  {
    id: "regulation-log",
    title: "Regulation Log",
    tagline: "Notice patterns without turning life into a spreadsheet.",
    purpose:
      "Builds a lightweight record of what preceded focus, friction, or recovery—so you can adjust environments and plans with data that feels human.",
    howToUse:
      "When you notice a shift (either direction), jot: time, state (0–3), one trigger, one intervention that helped—or 'nothing helped yet.' Weekly, scan for one pattern only; change one variable next week.",
    templateText: `REGULATION LOG — [Date: ___________]

TIME: ______   STATE (0–3): __   CONTEXT (where / what): _______________

TRIGGER (neutral words): _____________________________

INTERVENTION (what I tried): _________________________
Outcome: [ ] helped a little   [ ] no change yet   [ ] made it worse

ONE PATTERN HYPOTHESIS (optional, one line):
_____________________________________________________

WEEKLY REVIEW (one sentence):
The variable I'll adjust next week: _________________`,
  },
  {
    id: "body-doubling-session-sheet",
    title: "Body-Doubling Session Sheet",
    tagline: "Parallel presence—structure without surveillance.",
    purpose:
      "Makes parallel work sessions feel contained: clear start, shared silence or low chatter, and a respectful close—ideal for brains that start easier with gentle social gravity.",
    howToUse:
      "Before the session: declare task + finish test + timer. During: one optional midpoint check. After: one-line win + where to resume. Agree where phones 'park.'",
    templateText: `BODY-DOUBLING SESSION — [Date: ___________]

HOST / PLATFORM: _____________________________________
START: ______   END: ______   TIMER LENGTH: _________

MY TASK (one line):
_____________________________________________________

DONE TEST (what proves I'm done for this block?):
_____________________________________________________

MIDPOINT CHECK: [ ] yes at ___ min   [ ] no

PHONE PARK: _________________________________________

END CHECK — one win line:
_____________________________________________________

RESUME NOTE FOR NEXT TIME:
_____________________________________________________`,
  },
];

export type FocusAudioSession = {
  id: string;
  title: string;
  duration: string;
  whenToUse: string;
  openingPrompt: string;
  outcome: string;
  /** Optional on-rails timing; pair with your own sound or silence. */
  arc?: string[];
};

export const FOCUS_AUDIO_SESSIONS: FocusAudioSession[] = [
  {
    id: "ten-minute-start",
    title: "10-Minute Start",
    duration: "10 minutes",
    whenToUse:
      "When activation feels high and you need a believable on-ramp—first task of the day, returning after a break, or breaking a freeze on something small-but-real.",
    openingPrompt:
      "Say aloud, slowly: 'Starting is allowed. I only owe the next physical move—not the whole outcome.'",
    outcome:
      "You end with one honest rep of work completed (even micro) and a written next step—proof to your nervous system that motion is possible without a heroic sprint.",
    arc: [
      "0:00–1:00 — Arrive: water, shoulders down, one slow exhale.",
      "1:00–2:00 — Write the smallest true first move (hands-level).",
      "2:00–8:00 — One timer block on that move only; strays go to a sticky list.",
      "8:00–10:00 — One win line + next physical step for later.",
    ],
  },
  {
    id: "twenty-five-deep-focus",
    title: "25-Minute Deep Focus Sprint",
    duration: "25 minutes",
    whenToUse:
      "When you have a single thread worth depth—writing, admin batch, build work—and you want a premium-feeling container with a clean exit.",
    openingPrompt:
      "Whisper the done test once: 'I'm done when ___.' Park your phone where you can't reach it without standing up.",
    outcome:
      "You finish with either a completed slice or an explicit 'banked' state (resume packet written)—so depth doesn't collapse into endless open loops.",
    arc: [
      "0:00–2:00 — Single window / single doc; close the rest.",
      "2:00–20:00 — Deep lane; new tasks only on paper, not on screen.",
      "20:00–25:00 — Declare enough + one appreciation line (tiny counts).",
    ],
  },
  {
    id: "reset-after-distraction",
    title: "Reset After Distraction",
    duration: "8 minutes",
    whenToUse:
      "After pings, people pulls, or self-interrupts—when you want to return without a shame spiral or a full postmortem.",
    openingPrompt:
      "Name what happened in neutral language: 'I was pulled by ___'—not 'I failed.'",
    outcome:
      "You return to the task with a refreshed next physical step and a short restart timer—repair becomes a skill, not a character judgment.",
    arc: [
      "0:00–2:00 — One line: what interrupted me?",
      "2:00–4:00 — Three slow breaths; jaw + wrists release.",
      "4:00–6:00 — Re-read task + done test; rewrite next move if needed.",
      "6:00–8:00 — Fresh micro-sprint (even six minutes counts).",
    ],
  },
  {
    id: "shutdown-ritual",
    title: "Shutdown Ritual",
    duration: "12 minutes",
    whenToUse:
      "When output mode needs a dignified ending—before evenings, weekends, or any time your brain keeps rehearsing open loops.",
    openingPrompt:
      "Say: 'Closure is part of the work. I can stop without earning rest first.'",
    outcome:
      "You land with tomorrow's first physical step captured, one worry parked on paper, and a calmer off-ramp—protecting sleep and next-day restart.",
    arc: [
      "0:00–3:00 — Capture strays into one list (no solving).",
      "3:00–7:00 — Calendar glance; move one hard thing into a humane slot.",
      "7:00–10:00 — Tomorrow's first physical step + one parked worry.",
      "10:00–12:00 — Close laptop / clear surface / 'Enough for today.'",
    ],
  },
];

export const FOCUS_TOOLS_INTRO = {
  headline: "Focus tools that respect your bandwidth",
  body: "Structured guides you can print or keep open beside you—calm, premium, and built for real, focus-stretched days (not perfection demands).",
};

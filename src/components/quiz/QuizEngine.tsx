"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { questions } from "@/data/questions";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";
import { INFOCARD_STAGE } from "@/components/quiz/infocardStages";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import { getOrCreateActionEventId, trackEvent } from "@/lib/analytics/client";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";

// InfoCard only renders for `info`-type questions (first one appears after Q4),
// and ScaleQuestion only renders for `scale`-type questions (mid-quiz).
// Defer both so the landing-page chunk doesn't carry them.
const ScaleQuestion = dynamic(
  () => import("./ScaleQuestion").then(m => ({ default: m.ScaleQuestion })),
  { ssr: false },
);
const InfoCard = dynamic(
  () => import("./InfoCard").then(m => ({ default: m.InfoCard })),
  { ssr: false },
);
// Lightweight canvas field for the questions (the common case).
const FocusField = dynamic(
  () => import("@/components/v2/FocusField").then(m => ({ default: m.FocusField })),
  { ssr: false },
);
// WebGL field is mounted ONLY on the five infocards, so `three` is never
// requested during the questions and the GPU work is scoped to those screens.
const SignalFieldGL = dynamic(
  () => import("@/components/v2/SignalFieldGL").then(m => ({ default: m.SignalFieldGL })),
  { ssr: false },
);

const QUIZ_MILESTONES = [25, 50, 75] as const;

const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function QuizEngine() {
  const { answers, currentQuestionIndex, selectedOptions, submitAnswer, goBack } = useQuizStore();
  const { theme } = useFunnelTheme();
  const [direction, setDirection] = useState(1);
  const prevIndex = useRef(currentQuestionIndex);
  const sentMilestones = useRef<Set<number>>(new Set());

  const question = questions[currentQuestionIndex];
  const isInfo = question.inputType === "info";
  const isScale = question.inputType === "scale";
  const isMultiple = question.inputType === "multiple";

  /* Numeric progress indicator */
  const answeredCount = questions
    .slice(0, currentQuestionIndex + 1)
    .filter((q) => q.inputType !== "info").length;
  const totalCount = questions.filter((q) => q.inputType !== "info").length;

  /* The attention field organizes as the user progresses: noise → signal.
     On the infocards it follows the narrative stage (1 scattered → 5 organized)
     so the shared field visibly evolves across the five cards. */
  const infoStage = isInfo ? INFOCARD_STAGE[question.id] ?? 0 : 0;
  const progressCoherence = Math.min(0.85, (answeredCount / totalCount) * 0.9);
  const stageCoherence = 0.1 + ((Math.max(1, infoStage) - 1) / 4) * 0.85;
  // The field must never regress as the user advances: on an infocard take the
  // higher of progress and the card's stage target, so noise→signal only ever
  // organizes further — it never falls back toward chaos.
  const fieldCoherence = isInfo
    ? Math.max(progressCoherence, stageCoherence)
    : progressCoherence;

  useEffect(() => {
    const answeredCount = answers.filter((answer) => {
      const answeredQuestion = questions.find((q) => q.id === answer.questionId);
      return answeredQuestion && answeredQuestion.inputType !== "info";
    }).length;
    if (answeredCount === 0 || totalCount === 0) return;

    for (const milestone of QUIZ_MILESTONES) {
      const threshold = Math.ceil((totalCount * milestone) / 100);
      if (answeredCount < threshold || sentMilestones.current.has(milestone)) continue;

      const storageKey = `focusroute_quiz_milestone_${milestone}`;
      try {
        if (window.sessionStorage.getItem(storageKey)) {
          sentMilestones.current.add(milestone);
          continue;
        }
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // In restricted storage contexts, the in-memory guard still prevents render spam.
      }

      sentMilestones.current.add(milestone);
      trackEvent(FIRST_PARTY_EVENTS.quizMilestoneReached, {
        eventId: getOrCreateActionEventId(`quiz_milestone_${milestone}`, "quiz_milestone"),
        metadata: {
          milestone_percent: milestone,
          answered_count: answeredCount,
          total_questions: totalCount,
        },
      });
    }
  }, [answers, totalCount]);

  /* Per-question visibility — the drop-off signal the 25/50/75 milestones can't
     give. Fires once per screen shown (re-fires on back-navigation, which is
     itself useful signal). First-party only, never bridged to Meta/GTM. */
  useEffect(() => {
    if (isInfo) {
      trackEvent(FIRST_PARTY_EVENTS.infoCardViewed, {
        meta: false,
        metadata: { card_id: question.id },
      });
    } else {
      trackEvent(FIRST_PARTY_EVENTS.questionViewed, {
        meta: false,
        metadata: {
          question_id: question.id,
          question_index: answeredCount,
          total_questions: totalCount,
          input_type: question.inputType,
        },
      });
    }
  }, [question, isInfo, answeredCount, totalCount]);

  /* Per-question answer confirmation — completion signal per screen, vs the
     view signal above. Fires when an answer entry is added or changed
     (re-answers on back-nav refire deliberately). Sends ids and counts,
     never option content. First-party only. */
  const prevAnswersRef = useRef(answers);
  useEffect(() => {
    const prev = prevAnswersRef.current;
    prevAnswersRef.current = answers;
    if (prev === answers) return;
    for (const a of answers) {
      const old = prev.find((p) => p.questionId === a.questionId);
      if (old && old.selectedOptions.join("|") === a.selectedOptions.join("|")) continue;
      const answeredQuestion = questions.find((q) => q.id === a.questionId);
      if (!answeredQuestion) continue;
      const idx = questions
        .filter((q) => q.inputType !== "info")
        .findIndex((q) => q.id === a.questionId);
      trackEvent(FIRST_PARTY_EVENTS.questionAnswered, {
        meta: false,
        metadata: {
          question_id: a.questionId,
          question_index: idx + 1,
          total_questions: totalCount,
          input_type: answeredQuestion.inputType,
          option_count: a.selectedOptions.length,
        },
      });
    }
  }, [answers, totalCount]);

  // Slide direction follows question index; syncing in an effect avoids reading refs during render (react-hooks/refs).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- AnimatePresence direction tracks zustand index delta
    setDirection(currentQuestionIndex >= prevIndex.current ? 1 : -1);
    prevIndex.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    /* Scale handles its own advance */
    if (isScale) return;
    if (!isMultiple && !isInfo && selectedOptions.length === 1) {
      const t = setTimeout(() => submitAnswer(), 380);
      return () => clearTimeout(t);
    }
  }, [selectedOptions, isMultiple, isInfo, isScale, submitAnswer]);

  return (
    <div className="min-h-screen flex flex-col" style={{ position: "relative" }}>

      {/* ── Signal field — scattered attention organizing into a route. The
          questions use the lightweight canvas field; the WebGL field is mounted
          ONLY on the five infocards (heavier, scoped to those screens, disposed
          when the user returns to a question). Coherence only ever rises, so the
          metaphor organizes forward. Pure backdrop; keyed by theme to repaint. */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        {isInfo ? (
          <SignalFieldGL key={`gl-${theme}`} coherence={fieldCoherence} intensity={0.7} theme={theme} />
        ) : (
          <FocusField key={`ff-${theme}`} coherence={fieldCoherence} intensity={0.55} showRoute theme={theme} />
        )}
      </div>

      {/* ── Brand anchor — paid traffic lands straight on a question,
          so this is the only "where am I?" cue during the quiz. The top inset
          keeps the centred wordmark clear of the iPhone Dynamic Island / notch;
          env() resolves to 0 on desktop and older devices, so spacing there is
          unchanged and there is no hydration jump. */}
      <p
        className="v2-hud"
        style={{
          position: "relative",
          textAlign: "center",
          paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
          color: "var(--v2-signal-2)",
        }}
      >
        FocusRoute
      </p>
      {/* One-line orientation for cold paid traffic on the first screen only:
          what this is, how long it takes, what it isn't. */}
      {currentQuestionIndex === 0 && (
        <p
          style={{
            position: "relative",
            textAlign: "center",
            marginTop: 6,
            fontFamily: "var(--v2-font-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--v2-ink-faint)",
          }}
        >
          Free focus pattern check · ~3 min · Not a diagnosis
        </p>
      )}

      {/* ── Top bar ────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 w-full"
        style={{ position: "relative", padding: "10px 20px 14px" }}
      >
        <m.button
          onClick={currentQuestionIndex > 0 ? goBack : undefined}
          aria-hidden={currentQuestionIndex === 0}
          tabIndex={currentQuestionIndex === 0 ? -1 : 0}
          whileTap={{ scale: 0.88 }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            color: "var(--v2-ink-faint)",
            background: "transparent",
            border: "1px solid transparent",
            cursor: currentQuestionIndex > 0 ? "pointer" : "default",
            pointerEvents: currentQuestionIndex > 0 ? "auto" : "none",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
            visibility: currentQuestionIndex > 0 ? "visible" : "hidden",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(var(--v2-signal-rgb),0.10)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--v2-line-rgb),0.3)";
            (e.currentTarget as HTMLElement).style.color      = "var(--v2-ink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            (e.currentTarget as HTMLElement).style.color      = "var(--v2-ink-faint)";
          }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </m.button>

        <div className="flex-1 flex flex-col gap-1">
          {!isInfo && <ProgressBar currentIndex={currentQuestionIndex} />}
          {/* Hold back the numeric count until past the halfway mark: early
             counts read as "this is long", while "11 / 20" reads as momentum.
             The bar alone carries progress until then. */}
          {!isInfo && answeredCount * 2 > totalCount && (
            <p
              style={{
                fontFamily: "var(--v2-font-mono)",
                fontSize: 10.5,
                color: "var(--v2-ink-faint)",
                textAlign: "right",
                letterSpacing: "0.14em",
              }}
            >
              {String(answeredCount).padStart(2, "0")} / {totalCount}
            </p>
          )}
        </div>
      </div>

      {/* ── Slide stage ────────────────────────────────────── */}
      <div className="flex-1" style={{ position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={question.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x:       { type: "spring", stiffness: 320, damping: 32 },
              opacity: { duration: 0.18 },
            }}
            style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}
          >
            {isInfo    ? <InfoCard       question={question} /> :
             isScale   ? <ScaleQuestion  question={question} /> :
                         <QuestionCard   question={question} />
            }
          </m.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

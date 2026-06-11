"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { questions } from "@/data/questions";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";
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

const QUIZ_MILESTONES = [25, 50, 75] as const;

const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function QuizEngine() {
  const { answers, currentQuestionIndex, selectedOptions, submitAnswer, goBack } = useQuizStore();
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
    <div className="min-h-screen flex flex-col">

      {/* ── Brand anchor — paid traffic lands straight on a question,
          so this is the only "where am I?" cue during the quiz. */}
      <p style={{
        textAlign: "center",
        paddingTop: 14,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-signal)",
      }}>
        FocusRoute
      </p>

      {/* ── Top bar ────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 w-full"
        style={{ padding: "10px 20px 14px" }}
      >
        <m.button
          onClick={currentQuestionIndex > 0 ? goBack : undefined}
          aria-hidden={currentQuestionIndex === 0}
          tabIndex={currentQuestionIndex === 0 ? -1 : 0}
          whileTap={{ scale: 0.88 }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            color: "var(--color-text-muted)",
            background: "transparent",
            border: "none",
            cursor: currentQuestionIndex > 0 ? "pointer" : "default",
            pointerEvents: currentQuestionIndex > 0 ? "auto" : "none",
            transition: "background 0.15s, color 0.15s",
            visibility: currentQuestionIndex > 0 ? "visible" : "hidden",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--color-bg-card)";
            (e.currentTarget as HTMLElement).style.color      = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color      = "var(--color-text-muted)";
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
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textAlign: "right", letterSpacing: "0.04em" }}>
              {answeredCount} / {totalCount}
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

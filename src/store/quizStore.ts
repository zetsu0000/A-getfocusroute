import { create } from "zustand";
import { FunnelStep, QuizAnswer } from "@/types/quiz";
import { questions } from "@/data/questions";
import { clearPersistedQuizResultId } from "@/lib/quizResultId";

interface QuizState {
  currentStep: FunnelStep;
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  selectedOptions: string[];
  email: string;
  name: string;
  retakeMode: boolean;
  /** Server row id from POST /api/quiz-result; also mirrored in sessionStorage for funnel recovery. */
  quizResultId: string | null;

  selectOption: (optionId: string, inputType: "single" | "multiple") => void;
  submitAnswer: () => void;
  submitInfo: () => void;
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  goBack: () => void;
  setStep: (step: FunnelStep) => void;
  resetQuiz: () => void;
  startRetake: (email: string, name: string) => void;
  setQuizResultId: (id: string | null) => void;
}

/* Step order after loading */
const POST_LOADING: FunnelStep[] = ["email", "name", "chart", "paywall", "upsell", "subscription", "success"];

export const useQuizStore = create<QuizState>((set, get) => ({
  currentStep: "quiz",
  currentQuestionIndex: 0,
  answers: [],
  selectedOptions: [],
  email: "",
  name: "",
  retakeMode: false,
  quizResultId: null,

  selectOption: (optionId, inputType) => {
    const { selectedOptions } = get();
    if (inputType === "single") {
      set({ selectedOptions: [optionId] });
    } else {
      const isSelected = selectedOptions.includes(optionId);
      set({
        selectedOptions: isSelected
          ? selectedOptions.filter((id) => id !== optionId)
          : [...selectedOptions, optionId],
      });
    }
  },

  submitAnswer: () => {
    const { currentQuestionIndex, answers, selectedOptions } = get();
    const question = questions[currentQuestionIndex];

    const newAnswers: QuizAnswer[] = [
      ...answers.filter((a) => a.questionId !== question.id),
      { questionId: question.id, selectedOptions },
    ];

    const isLast = currentQuestionIndex >= questions.length - 1;
    if (isLast) {
      set({ answers: newAnswers, selectedOptions: [], currentStep: "loading" });
    } else {
      set({ answers: newAnswers, selectedOptions: [], currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  submitInfo: () => {
    const { currentQuestionIndex } = get();
    const isLast = currentQuestionIndex >= questions.length - 1;
    if (isLast) {
      set({ currentStep: "loading" });
    } else {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  setEmail: (email) => set({ email }),
  setName:  (name)  => set({ name }),

  /* Advance to next post-loading step */
  setStep: (step) => set({ currentStep: step }),

  goBack: () => {
    const { currentStep, currentQuestionIndex } = get();

    /* Post-loading steps: go back one step in the chain */
    const postIdx = POST_LOADING.indexOf(currentStep);
    if (postIdx > 0) {
      set({ currentStep: POST_LOADING[postIdx - 1] });
      return;
    }
    if (currentStep === "email") {
      set({ currentStep: "loading" });
      return;
    }
    if (currentStep === "loading" || currentStep === "paywall") {
      set({ currentStep: "quiz", currentQuestionIndex: questions.length - 1 });
      return;
    }
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1, selectedOptions: [] });
    }
  },

  setQuizResultId: (id) => set({ quizResultId: id }),

  resetQuiz: () => {
    clearPersistedQuizResultId();
    set({
      currentStep: "quiz",
      currentQuestionIndex: 0,
      answers: [],
      selectedOptions: [],
      email: "",
      name: "",
      retakeMode: false,
      quizResultId: null,
    });
  },

  startRetake: (email, name) => {
    clearPersistedQuizResultId();
    set({
      retakeMode: true,
      currentStep: "quiz",
      currentQuestionIndex: 0,
      answers: [],
      selectedOptions: [],
      email,
      name,
      quizResultId: null,
    });
  },
}));

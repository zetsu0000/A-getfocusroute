export type InputType = "single" | "multiple" | "info" | "scale";

export interface QuizOption {
  id: string;
  label: string;
  badge?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  inputType: InputType;
  options: QuizOption[];

  /* Info card fields */
  infoEmoji?: string;
  infoStat?: string;
  infoHighlight?: string;   /* highlighted (teal) portion inside infoStat */
  infoBody?: string;

  /* Scale question fields */
  statement?: string;       /* the quoted statement text */
}

export type FunnelStep = "quiz" | "loading" | "email" | "name" | "chart" | "paywall";

export interface QuizAnswer {
  questionId: string;
  selectedOptions: string[];
}

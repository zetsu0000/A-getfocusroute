import { QuizAnswer } from "@/types/quiz";

export type PlanType = "assessment" | "monthly" | "annual";

export interface UserSession {
  email: string;
  name: string;
  planType: PlanType;
  purchasedAt: string;
  answers: QuizAnswer[];
}

const SESSION_KEY = "focusroute_session";

export function saveSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function updateSessionAnswers(answers: QuizAnswer[]): void {
  const session = getSession();
  if (!session) return;
  saveSession({ ...session, answers });
}

export function canRetake(planType: PlanType): boolean {
  return planType === "monthly" || planType === "annual";
}

export function planLabel(planType: PlanType): string {
  if (planType === "monthly") return "Monthly Plan";
  if (planType === "annual") return "Annual Plan";
  return "ADHD Assessment";
}

export function planColor(planType: PlanType): string {
  if (planType === "annual") return "#F07000";
  if (planType === "monthly") return "#3DA06A";
  return "#4A7FA5";
}

export function planBg(planType: PlanType): string {
  if (planType === "annual") return "#FEF0DC";
  if (planType === "monthly") return "#E6F7EF";
  return "#EAF2F8";
}

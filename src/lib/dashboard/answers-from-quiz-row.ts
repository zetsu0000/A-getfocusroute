import type { QuizAnswer } from "@/types/quiz";

function parseQuizAnswers(payload: unknown): QuizAnswer[] {
  if (!Array.isArray(payload)) return [];
  const out: QuizAnswer[] = [];
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.questionId !== "string" || !Array.isArray(o.selectedOptions)) {
      continue;
    }
    const opts = o.selectedOptions.filter((x): x is string => typeof x === "string");
    out.push({ questionId: o.questionId, selectedOptions: opts });
  }
  return out;
}

/** Supports persisted `answers` column and legacy `payload` jsonb. */
export function answersFromQuizRow(row: Record<string, unknown> | null): QuizAnswer[] {
  if (!row) return [];
  if (row.answers != null) return parseQuizAnswers(row.answers);
  const payload = row.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    if (p.answers != null) return parseQuizAnswers(p.answers);
  }
  return [];
}

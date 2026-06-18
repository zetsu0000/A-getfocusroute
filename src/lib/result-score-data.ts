import type { QuizAnswer } from "@/types/quiz";
import { hasUsableScoreSignal, scoreFromAnswers } from "@/lib/symptom-level";

/** Canonical focus-friction score range produced by scoreFromAnswers. */
export const RESULT_SCORE_MIN = 0;
export const RESULT_SCORE_MAX = 100;

export type ResultScoreSource = "stored" | "computed";

export type ResultScoreData = {
  value: number;
  minimum: number;
  maximum: number;
  source: ResultScoreSource;
};

export type ResultScoreResolveInput = {
  answers?: unknown;
  /** Explicit persisted score passed by a future consumer after schema approval. */
  storedScore?: unknown;
};

function parseStoredScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < RESULT_SCORE_MIN || value > RESULT_SCORE_MAX) return null;
  return value;
}

/** Normalizes persisted quiz answers without mutating the source payload. */
export function normalizeQuizAnswers(value: unknown): QuizAnswer[] {
  if (!Array.isArray(value)) return [];
  const out: QuizAnswer[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.questionId !== "string" || !Array.isArray(o.selectedOptions)) {
      continue;
    }
    const opts = o.selectedOptions.filter(
      (x): x is string => typeof x === "string",
    );
    out.push({ questionId: o.questionId, selectedOptions: opts });
  }
  return out;
}

/**
 * Resolves canonical focus-friction score data for future result UI.
 * Uses the existing scoreFromAnswers algorithm — never a second formula.
 */
export function resolveResultScoreData(
  input: ResultScoreResolveInput,
): ResultScoreData | null {
  const stored = parseStoredScore(input.storedScore);
  if (stored != null) {
    return {
      value: stored,
      minimum: RESULT_SCORE_MIN,
      maximum: RESULT_SCORE_MAX,
      source: "stored",
    };
  }

  const answers = normalizeQuizAnswers(input.answers);
  if (answers.length === 0 || !hasUsableScoreSignal(answers)) return null;

  const value = scoreFromAnswers(answers);
  if (!Number.isFinite(value)) return null;

  return {
    value,
    minimum: RESULT_SCORE_MIN,
    maximum: RESULT_SCORE_MAX,
    source: "computed",
  };
}

/** Computes from current quiz_results row answers only — no persisted score column exists today. */
export function resolveResultScoreDataFromQuizRow(
  row: Record<string, unknown> | null | undefined,
): ResultScoreData | null {
  if (!row) return null;
  return resolveResultScoreData({ answers: row.answers });
}

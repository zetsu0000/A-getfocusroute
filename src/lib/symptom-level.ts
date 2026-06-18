export type SymptomLevel = 'Low' | 'Mild' | 'Moderate' | 'High' | 'Very High'

export interface LevelInfo {
  label: SymptomLevel
  color: string
  bg: string
  pct: number
  description?: string
}

const SCORE_MAP: Record<string, number> = {
  never: 18, rarely: 34, sometimes: 57, often: 74, always: 91,
}

const SCALE_MAP: Record<number, number> = { 1: 12, 2: 34, 3: 56, 4: 76, 5: 92 }

const FREQ_QUESTIONS = ['distraction', 'mood'] as const
const SCALE_QUESTIONS = [
  'scale-procrastination',
  'scale-focus',
  'scale-overwhelm',
  'scale-organization',
  'scale-memory',
  'scale-emotions',
] as const

type ScoreAnswerInput = { questionId: string; selectedOptions: string[] }[]

function collectScoreSignals(answers: ScoreAnswerInput): number[] {
  const signals: number[] = []

  for (const qid of FREQ_QUESTIONS) {
    const id = answers.find(a => a.questionId === qid)?.selectedOptions[0]
    if (id && SCORE_MAP[id] != null) signals.push(SCORE_MAP[id])
  }

  for (const qid of SCALE_QUESTIONS) {
    const raw = answers.find(a => a.questionId === qid)?.selectedOptions[0]
    const n = raw ? parseInt(raw, 10) : NaN
    if (Number.isFinite(n) && SCALE_MAP[n] != null) signals.push(SCALE_MAP[n])
  }

  return signals
}

/** True when at least one answer value is usable by scoreFromAnswers. */
export function hasUsableScoreSignal(answers: ScoreAnswerInput): boolean {
  return collectScoreSignals(answers).length > 0
}

/**
 * Overall focus-friction score (0-100), averaged across every available signal:
 * the two frequency questions (distraction, mood/recovery) and the six scale
 * statements. Reads only what the user actually answered, so it is deterministic
 * and safe for partial answers. With no usable signal it returns a neutral 57.
 */
export function scoreFromAnswers(answers: ScoreAnswerInput): number {
  const signals = collectScoreSignals(answers)

  if (signals.length === 0) return 57
  const avg = signals.reduce((sum, v) => sum + v, 0) / signals.length
  return Math.round(Math.max(0, Math.min(100, avg)))
}

export function getSymptomLevel(score: number): LevelInfo {
  const clamped = Math.max(0, Math.min(100, score))
  if (clamped <= 20) return { label: 'Low',       color: 'var(--color-primary)', bg: 'var(--color-primary-tint)', pct: 20  }
  if (clamped <= 40) return { label: 'Mild',      color: 'var(--color-primary-mid)', bg: 'var(--color-bg-card-2)', pct: 38  }
  if (clamped <= 60) return { label: 'Moderate',  color: 'var(--color-cognitive)', bg: 'var(--color-cognitive-tint)', pct: 62  }
  if (clamped <= 80) return { label: 'High',      color: 'var(--color-accent-dark)', bg: 'var(--color-accent-tint)', pct: 80  }
  return                     { label: 'Very High', color: 'var(--color-accent-dark)', bg: 'var(--color-accent-tint)', pct: 95  }
}

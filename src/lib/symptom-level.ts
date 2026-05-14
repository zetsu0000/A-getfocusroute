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

export function scoreFromAnswers(answers: { questionId: string; selectedOptions: string[] }[]): number {
  const id = answers.find(a => a.questionId === 'distraction')?.selectedOptions[0] ?? 'sometimes'
  return SCORE_MAP[id] ?? 57
}

export function getSymptomLevel(score: number): LevelInfo {
  const clamped = Math.max(0, Math.min(100, score))
  if (clamped <= 20) return { label: 'Low',       color: '#4A7FA5', bg: '#EAF2F8', pct: 20  }
  if (clamped <= 40) return { label: 'Mild',      color: '#6AA3C8', bg: '#E8F4FB', pct: 38  }
  if (clamped <= 60) return { label: 'Moderate',  color: '#F07000', bg: '#FEF0DC', pct: 62  }
  if (clamped <= 80) return { label: 'High',      color: '#CC5C3A', bg: '#FDEEE8', pct: 80  }
  return                     { label: 'Very High', color: '#A82E2E', bg: '#FCDEDE', pct: 95  }
}

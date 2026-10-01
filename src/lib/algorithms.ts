import type { AlgorithmDifficulty, AlgorithmVerdict } from '@/api/schemas/algorithms'
import { translate } from '@/i18n'

export const DIFFICULTY_ORDER: AlgorithmDifficulty[] = ['easy', 'medium', 'hard']

export function difficultyLabel(difficulty: AlgorithmDifficulty): string {
  return translate(`algorithms.difficulty.${difficulty}`)
}

export const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  cpp: 'C++',
  java: 'Java',
  csharp: 'C#',
  go: 'Go',
  kotlin: 'Kotlin',
}

export function languageLabel(key: string): string {
  return LANGUAGE_LABELS[key] ?? key
}

export function verdictLabel(verdict: AlgorithmVerdict | null): string {
  return verdict ? translate(`algorithms.verdicts.${verdict}`) : translate('algorithms.noVerdict')
}

/** Только accepted считается успехом — остальные вердикты красим как отказ. */
export function isAccepted(verdict: AlgorithmVerdict | null): boolean {
  return verdict === 'accepted'
}

export function memoryLabel(kb: number): string {
  return translate('units.mebibytes', { value: Math.round(kb / 1024) })
}

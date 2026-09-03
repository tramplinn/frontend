import type { AlgorithmDifficulty, AlgorithmVerdict } from '@/api/schemas/algorithms'

export const DIFFICULTY_LABELS: Record<AlgorithmDifficulty, string> = {
  easy: 'лёгкая',
  medium: 'средняя',
  hard: 'сложная',
}

export const DIFFICULTY_ORDER: AlgorithmDifficulty[] = ['easy', 'medium', 'hard']

export const VERDICT_LABELS: Record<AlgorithmVerdict, string> = {
  accepted: 'зачтено',
  wrong_answer: 'неверный ответ',
  compile_error: 'ошибка компиляции',
  runtime_error: 'ошибка выполнения',
  time_limit: 'превышено время',
  memory_limit: 'превышена память',
  output_limit: 'слишком большой вывод',
  internal_error: 'внутренняя ошибка',
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
  return verdict ? VERDICT_LABELS[verdict] : 'нет вердикта'
}

/** Только accepted считается успехом — остальные вердикты красим как отказ. */
export function isAccepted(verdict: AlgorithmVerdict | null): boolean {
  return verdict === 'accepted'
}

export function memoryLabel(kb: number): string {
  return `${String(Math.round(kb / 1024))} МиБ`
}

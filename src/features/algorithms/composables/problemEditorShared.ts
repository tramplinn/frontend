import { algorithmLanguageSchema } from '@/api/schemas/algorithmAuthoring'
import type { ProblemAuthor, TestCase } from '@/api/schemas/algorithmAuthoring'
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import { translate } from '@/i18n'

export interface ProblemFields {
  title: string
  statementMd: string
  difficulty: AlgorithmDifficulty
  tags: string[]
  timeLimitMs: number
  memoryLimitKb: number
}

export interface TestCaseFields {
  input: string
  expectedOutput: string
  isSample: boolean
  weight: number
}

export const ALL_LANGUAGES = algorithmLanguageSchema.options
export const AUTOSAVE_DEBOUNCE_MS = 700
export const incompleteFieldsMessage = (): string => translate('problemEditor.incomplete')

export function toFields(problem: ProblemAuthor): ProblemFields {
  return {
    title: problem.title,
    statementMd: problem.statementMd,
    difficulty: problem.difficulty,
    tags: problem.tags.map((tag) => tag.name),
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
  }
}

export function toCaseFields(item: TestCase): TestCaseFields {
  return {
    input: item.input,
    expectedOutput: item.expectedOutput,
    isSample: item.isSample,
    weight: item.weight,
  }
}

export function equalItems(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

/** v-model.number на пустом/нечисловом вводе оставляет исходную строку, а не 0 —
    без этой проверки автосейв мог бы отправить "" вместо числа в разгар перепечатки
    лимита и получить обратно ошибку валидации. */
export function hasValidFields(draft: ProblemFields | null): draft is ProblemFields {
  return (
    draft !== null &&
    draft.title.trim() !== '' &&
    Number.isFinite(draft.timeLimitMs) &&
    Number.isFinite(draft.memoryLimitKb)
  )
}

/** Общая точка сериализации автосохранений: карточка задачи, тесты и шаблоны
    решений пишутся через одну очередь, иначе параллельные запросы могут
    затереть друг друга или отправиться в непредсказуемом порядке. */
export interface SaveCoordinator {
  run: (key: string, action: () => Promise<void>) => Promise<void>
  enqueueSave: (action: () => Promise<void>) => Promise<boolean>
  flushQueue: () => Promise<void>
}

import type {
  TeacherAssistantDocument,
  TeacherAssistantPatch,
  TeacherAssistantTemplate,
  TeacherAssistantTestCase,
} from '@/api/schemas/teacherAssistant'
import { translate, type MessageKey } from '@/i18n'

export const fieldLabels: Record<keyof Omit<TeacherAssistantPatch, 'explanation'>, MessageKey> = {
  title: 'assistant.fields.title',
  bodyMd: 'assistant.fields.bodyMd',
  statementMd: 'assistant.fields.statementMd',
  difficulty: 'assistant.fields.difficulty',
  tags: 'assistant.fields.tags',
  timeLimitMs: 'assistant.fields.timeLimitMs',
  memoryLimitKb: 'assistant.fields.memoryLimitKb',
  testCases: 'assistant.fields.testCases',
  templates: 'assistant.fields.templates',
}

export type PatchField = keyof typeof fieldLabels
export const patchFields = Object.keys(fieldLabels) as PatchField[]

export type DiffKind = 'same' | 'remove' | 'add'

export interface DiffLine {
  kind: DiffKind
  text: string
}

export interface FieldChange {
  field: PatchField
  label: string
  lines: DiffLine[]
}

function isTestCase(value: unknown): value is TeacherAssistantTestCase {
  return typeof value === 'object' && value !== null && 'expectedOutput' in value
}

function isTemplate(value: unknown): value is TeacherAssistantTemplate {
  return typeof value === 'object' && value !== null && 'starterCode' in value
}

/** Тесты и решения — структуры, а не текст, поэтому рендерим их в читаемый блок
    построчно: тем же линейным diff'ом ниже это сравнивается как обычный текст. */
function textOf(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    if (isTestCase(value[0])) {
      return (value as TeacherAssistantTestCase[])
        .map(
          (item, index) =>
            `${String(index + 1)}. ${translate(item.isSample ? 'assistant.diff.sample' : 'assistant.diff.hidden')}\n` +
            `${translate('assistant.diff.input')}: ${item.input}\n` +
            `${translate('assistant.diff.output')}: ${item.expectedOutput}`,
        )
        .join('\n\n')
    }
    if (isTemplate(value[0])) {
      return (value as TeacherAssistantTemplate[])
        .map(
          (item) =>
            `${item.language}\n${translate('assistant.diff.starter')}:\n${item.starterCode}\n` +
            `${translate('assistant.diff.solution')}:\n${item.solutionCode}`,
        )
        .join('\n\n')
    }
    return value.join(', ')
  }
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return ''
}

/** Линейный diff сохраняет общий контекст сверху и снизу. Большой переписанный
    фрагмент остаётся двумя цельными блоками и не подвешивает браузер на длинном уроке. */
export function diffLines(beforeValue: unknown, afterValue: unknown): DiffLine[] {
  const before = textOf(beforeValue).split('\n')
  const after = textOf(afterValue).split('\n')
  let prefix = 0
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) {
    prefix += 1
  }
  let suffix = 0
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - suffix - 1] === after[after.length - suffix - 1]
  ) {
    suffix += 1
  }

  return [
    ...before.slice(0, prefix).map((text) => ({ kind: 'same' as const, text })),
    ...before
      .slice(prefix, before.length - suffix)
      .map((text) => ({ kind: 'remove' as const, text })),
    ...after.slice(prefix, after.length - suffix).map((text) => ({ kind: 'add' as const, text })),
    ...(suffix === 0
      ? []
      : before.slice(before.length - suffix).map((text) => ({ kind: 'same' as const, text }))),
  ]
}

export function changesFor(
  document: TeacherAssistantDocument,
  suggestion: TeacherAssistantPatch,
): FieldChange[] {
  return patchFields
    .filter(
      (field) =>
        suggestion[field] !== null && textOf(suggestion[field]) !== textOf(document[field]),
    )
    .map((field) => ({
      field,
      label: translate(fieldLabels[field]),
      lines: diffLines(document[field], suggestion[field]),
    }))
}

export function patchFor(
  suggestion: TeacherAssistantPatch,
  fields: PatchField[],
): TeacherAssistantPatch {
  const has = (field: PatchField): boolean => fields.includes(field)
  return {
    explanation: suggestion.explanation,
    title: has('title') ? suggestion.title : null,
    bodyMd: has('bodyMd') ? suggestion.bodyMd : null,
    statementMd: has('statementMd') ? suggestion.statementMd : null,
    difficulty: has('difficulty') ? suggestion.difficulty : null,
    tags: has('tags') ? suggestion.tags : null,
    timeLimitMs: has('timeLimitMs') ? suggestion.timeLimitMs : null,
    memoryLimitKb: has('memoryLimitKb') ? suggestion.memoryLimitKb : null,
    testCases: has('testCases') ? suggestion.testCases : null,
    templates: has('templates') ? suggestion.templates : null,
  }
}

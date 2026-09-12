import type { QuestionType } from '@/api/schemas/common'
import type { QuizQuestionAuthor } from '@/api/schemas/content'
import type { Asset } from '@/api/schemas/assets'

export interface EditableQuestion {
  promptMd: string
  type: QuestionType
  options: string[]
  correct: number[]
  accepted: string[]
  caseSensitive: boolean
  explainMd: string
  interactionLines: string[]
  attachments: Asset[]
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function toEditableQuestion(question: QuizQuestionAuthor): EditableQuestion {
  // options у single/multiple — плоские строки; у matching/grouping это объекты
  // {id, kind, label}, которые восстанавливаются в interactionLines ниже. Раньше
  // toText() сериализовал их в options и тем самым забивал единственный список,
  // общий для всех типов вопроса, — после переключения на «один ответ»/«несколько»
  // без перезагрузки страницы там всплывали сырые JSON-строки.
  const isChoice = question.type === 'single' || question.type === 'multiple'
  const options = isChoice ? question.options.map(toText) : []
  const answer = question.answer
  const values = Array.isArray(answer.values) ? answer.values.map(toText) : []
  const single = answer.value === undefined ? [] : [toText(answer.value)]
  const chosen = question.type === 'multiple' ? values : single
  return {
    promptMd: question.promptMd,
    type: question.type,
    options,
    correct: chosen.map((value) => options.indexOf(value)).filter((index) => index >= 0),
    accepted: Array.isArray(answer.accepted) ? answer.accepted.map(toText) : [],
    caseSensitive: answer.caseSensitive === true,
    explainMd: question.explainMd ?? '',
    interactionLines: interactionLines(question),
    attachments: question.attachments,
  }
}

export function toQuestionAnswer(draft: EditableQuestion): Record<string, unknown> {
  if (draft.type === 'single') {
    return { value: draft.options[draft.correct[0] ?? -1] ?? '' }
  }
  if (draft.type === 'multiple') {
    return { values: draft.correct.map((index) => draft.options[index] ?? '') }
  }
  if (draft.type === 'matching') {
    const pairs = Object.fromEntries(
      parsedLines(draft.interactionLines, '=').map((_, index) => [
        `left-${String(index + 1)}`,
        `right-${String(index + 1)}`,
      ]),
    )
    return { pairs }
  }
  if (draft.type === 'grouping') {
    const groups: Record<string, string> = {}
    for (const [groupIndex, line] of parsedLines(draft.interactionLines, ':').entries()) {
      for (const [itemIndex] of splitItems(line.right).entries()) {
        groups[`item-${String(groupIndex + 1)}-${String(itemIndex + 1)}`] =
          `group-${String(groupIndex + 1)}`
      }
    }
    return { groups }
  }
  if (draft.type === 'file') {
    return {}
  }
  return {
    accepted: draft.accepted.filter((item) => item.trim() !== ''),
    case_sensitive: draft.caseSensitive,
  }
}

export function toQuestionOptions(draft: EditableQuestion): unknown[] {
  if (draft.type === 'single' || draft.type === 'multiple') {
    return draft.options
  }
  if (draft.type === 'matching') {
    return parsedLines(draft.interactionLines, '=').flatMap((line, index) => [
      { kind: 'left', id: `left-${String(index + 1)}`, label: line.left },
      { kind: 'right', id: `right-${String(index + 1)}`, label: line.right },
    ])
  }
  if (draft.type === 'grouping') {
    return parsedLines(draft.interactionLines, ':').flatMap((line, groupIndex) => [
      {
        kind: 'group',
        id: `group-${String(groupIndex + 1)}`,
        label: line.left,
      },
      ...splitItems(line.right).map((label, itemIndex) => ({
        kind: 'item',
        id: `item-${String(groupIndex + 1)}-${String(itemIndex + 1)}`,
        label,
      })),
    ])
  }
  return []
}

/** Черновик достаточно заполнен, чтобы его вообще стоило отправлять на сервер —
    иначе автосейв уходит сразу после смены типа вопроса, пока пары/варианты
    ещё не введены, и сервер честно отвечает invalid_quiz на пустой ответ. */
export function hasAnswerContent(draft: EditableQuestion): boolean {
  if (draft.type === 'single' || draft.type === 'multiple') {
    return draft.options.some((option) => option.trim() !== '') && draft.correct.length > 0
  }
  if (draft.type === 'matching') {
    return parsedLines(draft.interactionLines, '=').length > 0
  }
  if (draft.type === 'grouping') {
    return parsedLines(draft.interactionLines, ':').length > 0
  }
  if (draft.type === 'text') {
    return draft.accepted.some((item) => item.trim() !== '')
  }
  return true
}

interface InteractionLine {
  left: string
  right: string
}

function parsedLines(lines: string[], separator: '=' | ':'): InteractionLine[] {
  return lines.flatMap((raw) => {
    const at = raw.indexOf(separator)
    if (at < 0) return []
    const left = raw.slice(0, at).trim()
    const right = raw.slice(at + 1).trim()
    return left && right ? [{ left, right }] : []
  })
}

function splitItems(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function interactionLines(question: QuizQuestionAuthor): string[] {
  const records = question.options.flatMap((value) =>
    typeof value === 'object' && value !== null ? [value as Record<string, unknown>] : [],
  )
  const byId = new Map(
    records.flatMap((item) =>
      typeof item.id === 'string' && typeof item.label === 'string'
        ? [[item.id, item.label] as const]
        : [],
    ),
  )
  if (question.type === 'matching') {
    const pairs = recordOfStrings(question.answer.pairs)
    return records.flatMap((item) =>
      item.kind === 'left' && typeof item.id === 'string' && typeof item.label === 'string'
        ? [`${item.label} = ${byId.get(pairs[item.id] ?? '') ?? ''}`]
        : [],
    )
  }
  if (question.type === 'grouping') {
    const groups = recordOfStrings(question.answer.groups)
    return records.flatMap((group) => {
      if (
        group.kind !== 'group' ||
        typeof group.id !== 'string' ||
        typeof group.label !== 'string'
      ) {
        return []
      }
      const labels = records.flatMap((item) =>
        item.kind === 'item' &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        groups[item.id] === group.id
          ? [item.label]
          : [],
      )
      return [`${group.label}: ${labels.join(', ')}`]
    })
  }
  return []
}

function recordOfStrings(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

export function removeQuestionOption(
  draft: EditableQuestion,
  index: number,
): Pick<EditableQuestion, 'options' | 'correct'> {
  return {
    options: draft.options.filter((_, at) => at !== index),
    correct: draft.correct.filter((at) => at !== index).map((at) => (at > index ? at - 1 : at)),
  }
}

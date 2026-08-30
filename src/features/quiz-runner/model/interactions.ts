import type { QuestionType } from '@/api/schemas/common'
import type { QuizQuestion } from '@/api/schemas/content'

export interface InteractiveOption {
  id: string
  kind: 'left' | 'right' | 'group' | 'item'
  label: string
}

export type PlacementMap = Record<string, string>

export function interactiveOptions(
  question: QuizQuestion,
  kind: InteractiveOption['kind'],
): InteractiveOption[] {
  return question.options.flatMap((value) => {
    if (typeof value !== 'object' || value === null) return []
    const item = value as Record<string, unknown>
    return item.kind === kind && typeof item.id === 'string' && typeof item.label === 'string'
      ? [{ id: item.id, kind, label: item.label }]
      : []
  })
}

/** Один правый элемент может соответствовать только одному левому. */
export function placeMatching(
  placements: PlacementMap,
  rightId: string,
  leftId: string,
): PlacementMap {
  return {
    ...Object.fromEntries(Object.entries(placements).filter(([, value]) => value !== rightId)),
    [leftId]: rightId,
  }
}

export function placeGrouping(
  placements: PlacementMap,
  itemId: string,
  groupId: string,
): PlacementMap {
  return { ...placements, [itemId]: groupId }
}

export function matchingLabel(
  question: QuizQuestion,
  placements: PlacementMap,
  leftId: string,
): string | null {
  const rightId = placements[leftId]
  return interactiveOptions(question, 'right').find((item) => item.id === rightId)?.label ?? null
}

export function groupedItems(
  question: QuizQuestion,
  placements: PlacementMap,
  groupId: string,
): InteractiveOption[] {
  return interactiveOptions(question, 'item').filter((item) => placements[item.id] === groupId)
}

export function unplacedItems(
  question: QuizQuestion,
  placements: PlacementMap,
  kind: 'right' | 'item',
): InteractiveOption[] {
  return interactiveOptions(question, kind)
    .filter((item) =>
      kind === 'right'
        ? !Object.values(placements).includes(item.id)
        : placements[item.id] === undefined,
    )
    .sort((left, right) => left.label.localeCompare(right.label, 'ru'))
}

export function interactionAnswer(
  type: Extract<QuestionType, 'matching' | 'grouping'>,
  placements: PlacementMap,
): Record<string, PlacementMap> {
  return type === 'matching' ? { pairs: placements } : { groups: placements }
}

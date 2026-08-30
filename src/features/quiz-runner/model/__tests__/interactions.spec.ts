import { describe, expect, it } from 'vitest'

import type { QuizQuestion } from '@/api/schemas/content'
import {
  groupedItems,
  interactionAnswer,
  interactiveOptions,
  matchingLabel,
  placeGrouping,
  placeMatching,
  unplacedItems,
} from '../interactions'

function question(type: QuizQuestion['type'], options: unknown[]): QuizQuestion {
  return {
    id: '01910000-0000-7000-8000-000000000001',
    position: 1,
    promptMd: 'Задание',
    type,
    options,
    attachments: [],
  }
}

describe('quiz runner interactions', () => {
  const matching = question('matching', [
    { kind: 'left', id: 'left-http', label: 'HTTP' },
    { kind: 'right', id: 'right-protocol', label: 'Протокол' },
    { kind: 'left', id: 'left-vue', label: 'Vue' },
    { kind: 'right', id: 'right-ui', label: 'Интерфейс' },
    null,
    { kind: 'right', id: 42, label: 'повреждённый элемент' },
  ])

  it('filters malformed interactive options', () => {
    expect(interactiveOptions(matching, 'right')).toEqual([
      { kind: 'right', id: 'right-protocol', label: 'Протокол' },
      { kind: 'right', id: 'right-ui', label: 'Интерфейс' },
    ])
  })

  it('moves a matching token instead of duplicating it', () => {
    const first = placeMatching({}, 'right-protocol', 'left-http')
    const moved = placeMatching(first, 'right-protocol', 'left-vue')

    expect(moved).toEqual({ 'left-vue': 'right-protocol' })
    expect(matchingLabel(matching, moved, 'left-http')).toBeNull()
    expect(matchingLabel(matching, moved, 'left-vue')).toBe('Протокол')
  })

  it('hides placed tokens and sorts the remaining pool independently of author order', () => {
    expect(unplacedItems(matching, { 'left-http': 'right-protocol' }, 'right')).toEqual([
      { kind: 'right', id: 'right-ui', label: 'Интерфейс' },
    ])
    expect(unplacedItems(matching, {}, 'right').map((item) => item.label)).toEqual([
      'Интерфейс',
      'Протокол',
    ])
  })

  it('moves an item between groups and builds the API answer shape', () => {
    const grouping = question('grouping', [
      { kind: 'group', id: 'frontend', label: 'Frontend' },
      { kind: 'group', id: 'backend', label: 'Backend' },
      { kind: 'item', id: 'vue', label: 'Vue' },
      { kind: 'item', id: 'python', label: 'Python' },
    ])
    const inFrontend = placeGrouping({}, 'vue', 'frontend')
    const inBackend = placeGrouping(inFrontend, 'vue', 'backend')

    expect(groupedItems(grouping, inBackend, 'frontend')).toEqual([])
    expect(groupedItems(grouping, inBackend, 'backend').map((item) => item.id)).toEqual(['vue'])
    expect(unplacedItems(grouping, inBackend, 'item').map((item) => item.id)).toEqual(['python'])
    expect(interactionAnswer('grouping', inBackend)).toEqual({ groups: { vue: 'backend' } })
    expect(interactionAnswer('matching', { 'left-http': 'right-protocol' })).toEqual({
      pairs: { 'left-http': 'right-protocol' },
    })
  })
})

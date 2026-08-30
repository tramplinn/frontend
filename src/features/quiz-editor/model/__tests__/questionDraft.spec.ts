import { describe, expect, it } from 'vitest'

import {
  removeQuestionOption,
  toEditableQuestion,
  toQuestionAnswer,
  toQuestionOptions,
  type EditableQuestion,
} from '../questionDraft'

const draft = (changes: Partial<EditableQuestion> = {}): EditableQuestion => ({
  promptMd: 'question',
  type: 'single',
  options: ['first', 'second', 'third'],
  correct: [1],
  accepted: [],
  caseSensitive: false,
  explainMd: '',
  interactionLines: [],
  attachments: [],
  ...changes,
})

describe('quiz question draft', () => {
  it('serializes each supported answer type', () => {
    expect(toQuestionAnswer(draft())).toEqual({ value: 'second' })
    expect(toQuestionAnswer(draft({ type: 'multiple', correct: [0, 2] }))).toEqual({
      values: ['first', 'third'],
    })
    expect(
      toQuestionAnswer(draft({ type: 'text', accepted: ['yes', ' ', 'да'], caseSensitive: true })),
    ).toEqual({ accepted: ['yes', 'да'], case_sensitive: true })
    const matching = draft({ type: 'matching', interactionLines: ['HTTP = протокол', 'Vue = UI'] })
    expect(toQuestionAnswer(matching)).toEqual({
      pairs: { 'left-1': 'right-1', 'left-2': 'right-2' },
    })
    expect(toQuestionOptions(matching)).toEqual([
      { kind: 'left', id: 'left-1', label: 'HTTP' },
      { kind: 'right', id: 'right-1', label: 'протокол' },
      { kind: 'left', id: 'left-2', label: 'Vue' },
      { kind: 'right', id: 'right-2', label: 'UI' },
    ])
    const grouping = draft({
      type: 'grouping',
      interactionLines: ['Frontend: Vue, CSS', 'Backend: Python'],
    })
    expect(toQuestionAnswer(grouping)).toEqual({
      groups: {
        'item-1-1': 'group-1',
        'item-1-2': 'group-1',
        'item-2-1': 'group-2',
      },
    })
    expect(toQuestionAnswer(draft({ type: 'file' }))).toEqual({})
  })

  it('keeps correct indexes aligned when an option is removed', () => {
    expect(removeQuestionOption(draft({ correct: [0, 2] }), 1)).toEqual({
      options: ['first', 'third'],
      correct: [0, 1],
    })
  })

  it('restores matching lines from an author API response', () => {
    const editable = toEditableQuestion({
      id: '01910000-0000-7000-8000-000000000001',
      position: 1,
      promptMd: 'Соотнесите',
      type: 'matching',
      options: [
        { kind: 'right', id: 'r2', label: 'UI' },
        { kind: 'left', id: 'l1', label: 'HTTP' },
        { kind: 'right', id: 'r1', label: 'Протокол' },
        { kind: 'left', id: 'l2', label: 'Vue' },
      ],
      attachments: [],
      answer: { pairs: { l1: 'r1', l2: 'r2' } },
      explainMd: null,
    })

    expect(editable.interactionLines).toEqual(['HTTP = Протокол', 'Vue = UI'])
  })

  it('restores grouping lines and attached materials from an author API response', () => {
    const attachment = {
      id: '01910000-0000-7000-8000-000000000002',
      filename: 'terms.pdf',
      mime: 'application/pdf' as const,
      size: 1024,
      url: 'https://cdn.example.test/terms.pdf',
    }
    const editable = toEditableQuestion({
      id: '01910000-0000-7000-8000-000000000001',
      position: 1,
      promptMd: 'Распределите',
      type: 'grouping',
      options: [
        { kind: 'item', id: 'vue', label: 'Vue' },
        { kind: 'group', id: 'front', label: 'Frontend' },
        { kind: 'group', id: 'back', label: 'Backend' },
        { kind: 'item', id: 'python', label: 'Python' },
      ],
      attachments: [attachment],
      answer: { groups: { vue: 'front', python: 'back' } },
      explainMd: 'Пояснение',
    })

    expect(editable.interactionLines).toEqual(['Frontend: Vue', 'Backend: Python'])
    expect(editable.attachments).toEqual([attachment])
  })

  it('ignores incomplete editor lines instead of creating broken options', () => {
    const matching = draft({
      type: 'matching',
      interactionLines: ['HTTP = protocol', 'without separator', ' = empty', 'Vue = '],
    })

    expect(toQuestionOptions(matching)).toEqual([
      { kind: 'left', id: 'left-1', label: 'HTTP' },
      { kind: 'right', id: 'right-1', label: 'protocol' },
    ])
    expect(toQuestionAnswer(matching)).toEqual({ pairs: { 'left-1': 'right-1' } })
  })
})

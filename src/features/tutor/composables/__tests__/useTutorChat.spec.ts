import { describe, expect, it } from 'vitest'

import type { TutorTurn } from '@/api/tutor'

import { tutorRequestHistory } from '../useTutorChat'

function conversation(pairs: number): TutorTurn[] {
  return Array.from({ length: pairs }, (_, index): TutorTurn[] => [
    { role: 'user', content: `вопрос ${String(index)}` },
    { role: 'assistant', content: `ответ ${String(index)}` },
  ]).flat()
}

describe('tutorRequestHistory', () => {
  it('после 30 вопросов шлёт хвост в пределах лимита бэкенда, а не всю историю', () => {
    const history = [...conversation(30), { role: 'user' as const, content: 'новый вопрос' }]
    const sent = tutorRequestHistory(history)
    expect(sent.length).toBeLessThanOrEqual(50)
    expect(sent.at(-1)).toEqual({ role: 'user', content: 'новый вопрос' })
  })

  it('обрезает длинный прошлый ответ до 8000 символов', () => {
    const history: TutorTurn[] = [
      { role: 'user', content: 'объясни' },
      { role: 'assistant', content: 'x'.repeat(12_000) },
      { role: 'user', content: 'а подробнее?' },
    ]
    const sent = tutorRequestHistory(history)
    expect(sent[1]?.content).toHaveLength(8000)
    expect(sent[2]).toEqual({ role: 'user', content: 'а подробнее?' })
  })

  it('короткую историю не трогает', () => {
    const history = conversation(2)
    expect(tutorRequestHistory(history)).toEqual(history)
  })
})

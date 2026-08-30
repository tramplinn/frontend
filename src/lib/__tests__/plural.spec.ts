import { describe, expect, it } from 'vitest'

import { withCount } from '../plural'

describe('withCount', () => {
  const lessons = (count: number): string => withCount(count, 'урок', 'урока', 'уроков')

  it('ставит единственное число на 1 и 21', () => {
    expect(lessons(1)).toBe('1 урок')
    expect(lessons(21)).toBe('21 урок')
  })

  it('ставит форму «урока» на 2–4 и 22', () => {
    expect(lessons(2)).toBe('2 урока')
    expect(lessons(4)).toBe('4 урока')
    expect(lessons(22)).toBe('22 урока')
  })

  it('ставит форму «уроков» на 5–20 и на ноль', () => {
    expect(lessons(0)).toBe('0 уроков')
    expect(lessons(5)).toBe('5 уроков')
    expect(lessons(11)).toBe('11 уроков')
    expect(lessons(14)).toBe('14 уроков')
  })
})

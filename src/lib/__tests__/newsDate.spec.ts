import { describe, expect, it } from 'vitest'

import { formatNewsDate } from '@/lib/newsDate'

describe('formatNewsDate', () => {
  it('formats a published date in Russian', () => {
    expect(formatNewsDate('2026-09-03T18:56:13Z')).toBe('3 сентября 2026 г.')
  })

  it('leaves an unpublished draft without a date', () => {
    expect(formatNewsDate(null)).toBe('')
  })
})

import { describe, expect, it } from 'vitest'

import {
  DIFFICULTY_ORDER,
  isAccepted,
  languageLabel,
  memoryLabel,
  verdictLabel,
} from '@/lib/algorithms'

describe('algorithm labels', () => {
  it('orders difficulty from easy to hard', () => {
    expect(DIFFICULTY_ORDER).toEqual(['easy', 'medium', 'hard'])
  })

  it('treats only accepted as success', () => {
    expect(isAccepted('accepted')).toBe(true)
    expect(isAccepted('wrong_answer')).toBe(false)
    expect(isAccepted(null)).toBe(false)
  })

  it('names verdicts in russian and survives a missing verdict', () => {
    expect(verdictLabel('time_limit')).toBe('превышено время')
    expect(verdictLabel(null)).toBe('нет вердикта')
  })

  it('falls back to the raw key for an unknown language', () => {
    expect(languageLabel('cpp')).toBe('C++')
    expect(languageLabel('brainfuck')).toBe('brainfuck')
  })

  it('shows memory limits in mebibytes', () => {
    expect(memoryLabel(262144)).toBe('256 МиБ')
  })
})

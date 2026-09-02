import { describe, expect, it } from 'vitest'

import { blankToNull, numberOrNull } from '@/lib/forms'

describe('blankToNull', () => {
  it('превращает пустое и пробельное поле в null', () => {
    expect(blankToNull('')).toBeNull()
    expect(blankToNull('   ')).toBeNull()
  })

  it('обрезает пробелы вокруг значения', () => {
    expect(blankToNull('  Backend  ')).toBe('Backend')
  })
})

describe('numberOrNull', () => {
  it('возвращает null на пустом поле', () => {
    expect(numberOrNull('  ')).toBeNull()
  })

  it('читает число', () => {
    expect(numberOrNull(' 12 ')).toBe(12)
  })

  it('возвращает null, а не NaN, на нечисле', () => {
    expect(numberOrNull('двенадцать')).toBeNull()
  })
})

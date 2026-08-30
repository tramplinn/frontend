import { describe, expect, it } from 'vitest'

import { toggledTheme } from '@/composables/useTheme'

describe('toggledTheme', () => {
  it('switches a dark system theme to light in one click', () => {
    expect(toggledTheme('system', true)).toBe('light')
  })

  it('switches a light system theme to dark in one click', () => {
    expect(toggledTheme('system', false)).toBe('dark')
  })

  it('toggles explicit themes directly', () => {
    expect(toggledTheme('dark', false)).toBe('light')
    expect(toggledTheme('light', true)).toBe('dark')
  })
})

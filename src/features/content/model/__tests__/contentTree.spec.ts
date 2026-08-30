import { describe, expect, it } from 'vitest'

import { contentStatusAction, swapAdjacent, toggleContentStatus } from '../contentTree'

describe('content tree helpers', () => {
  it('toggles publication status and action label', () => {
    expect(toggleContentStatus('draft')).toBe('published')
    expect(toggleContentStatus('published')).toBe('draft')
    expect(contentStatusAction('draft')).toBe('опубликовать')
    expect(contentStatusAction('published')).toBe('снять')
  })

  it('swaps adjacent ids without mutating the source', () => {
    const ids = ['a', 'b', 'c']
    expect(swapAdjacent(ids, 1, -1)).toEqual(['b', 'a', 'c'])
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('does not produce an order outside list bounds', () => {
    expect(swapAdjacent(['a'], 0, -1)).toBeNull()
    expect(swapAdjacent(['a'], 0, 1)).toBeNull()
  })
})

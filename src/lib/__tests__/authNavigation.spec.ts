import { describe, expect, it } from 'vitest'

import { authNextPath } from '@/lib/authNavigation'

describe('authNextPath', () => {
  it('returns the protected route requested by the router guard', () => {
    expect(authNextPath('/?login=/me', '/me')).toBe('/me')
    expect(
      authNextPath(
        '/?login=/courses/demo/module/quizzes/test',
        '/courses/demo/module/quizzes/test',
      ),
    ).toBe('/courses/demo/module/quizzes/test')
  })

  it('falls back to the current local route for invalid values', () => {
    expect(authNextPath('/courses', undefined)).toBe('/courses')
    expect(authNextPath('/courses', 'https://example.com')).toBe('/courses')
    expect(authNextPath('/courses', '//example.com')).toBe('/courses')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listCourses } from '@/api/content'
import { getCourseProgress } from '@/api/learning'
import { fetchStartedCourses } from '@/features/learning/queries'

vi.mock('@/api/content', () => ({ listCourses: vi.fn() }))
vi.mock('@/api/learning', () => ({ getCourseProgress: vi.fn() }))

function course(slug: string) {
  return { slug, title: slug.toUpperCase(), summary: null }
}

describe('fetchStartedCourses', () => {
  beforeEach(() => vi.resetAllMocks())

  it('keeps only started courses, most complete first', async () => {
    vi.mocked(listCourses).mockResolvedValue([course('a'), course('b'), course('c')] as Awaited<
      ReturnType<typeof listCourses>
    >)
    const progress = { a: [1, 10], b: [0, 5], c: [4, 4] } as Record<string, [number, number]>
    vi.mocked(getCourseProgress).mockImplementation((slug) => {
      const [completedLessons, totalLessons] = progress[slug] ?? [0, 0]
      return Promise.resolve({ completedLessons, totalLessons } as Awaited<
        ReturnType<typeof getCourseProgress>
      >)
    })

    const started = await fetchStartedCourses()

    expect(started.map((item) => item.slug)).toEqual(['c', 'a'])
    expect(started[1]).toMatchObject({ completed: 1, total: 10, title: 'A' })
  })
})

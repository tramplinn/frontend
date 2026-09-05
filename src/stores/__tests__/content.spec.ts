import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCourse, listModuleDependencies, listTracks } from '@/api/content'
import type { CourseTree, Track } from '@/api/schemas/content'
import { useContentStore } from '@/stores/content'

vi.mock('@/api/content', () => ({
  getCourse: vi.fn(),
  listModuleDependencies: vi.fn(),
  listTracks: vi.fn(),
}))

const course: CourseTree = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'TypeScript',
  slug: 'typescript',
  summary: null,
  color: null,
  estHours: null,
  coverAssetId: null,
  coverUrl: null,
  status: 'published',
  tags: [],
  modules: [],
}

const tracks: Track[] = []

describe('content store request coordination', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(listModuleDependencies).mockResolvedValue([])
    vi.mocked(listTracks).mockResolvedValue(tracks)
  })

  it('shares one request between concurrent course consumers', async () => {
    vi.mocked(getCourse).mockResolvedValue(course)
    const store = useContentStore()

    const [first, second] = await Promise.all([
      store.loadCourse(course.slug),
      store.loadCourse(course.slug),
    ])

    expect(first).toBe(course)
    expect(second).toBe(course)
    expect(getCourse).toHaveBeenCalledOnce()
    expect(listModuleDependencies).toHaveBeenCalledOnce()
  })

  it('allows a retry after a failed course request', async () => {
    vi.mocked(getCourse).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(course)
    const store = useContentStore()

    await expect(store.loadCourse(course.slug)).rejects.toThrow('offline')
    await expect(store.loadCourse(course.slug)).resolves.toBe(course)
    expect(getCourse).toHaveBeenCalledTimes(2)
  })

  it('shares track loading and then serves the cache', async () => {
    const store = useContentStore()

    await Promise.all([store.loadTracks(), store.loadTracks()])
    await store.loadTracks()

    expect(listTracks).toHaveBeenCalledOnce()
  })
})

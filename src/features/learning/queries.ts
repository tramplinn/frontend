import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { listCourses } from '@/api/content'
import { getCourseProgress } from '@/api/learning'
import { useAuthStore } from '@/stores/auth'

export interface StartedCourse {
  slug: string
  title: string
  summary: string | null
  completed: number
  total: number
}

/** Ключи кешируются по пользователю: после смены аккаунта чужие данные не всплывут. */
export const learningKeys = {
  all: ['learning'] as const,
  started: (userId: string) => [...learningKeys.all, userId, 'started'] as const,
}

/** Эндпоинта «мои курсы» на бэкенде нет: агрегат собирается запросом на курс.
    Для колледжа это единицы запросов, при росте каталога нужен свой роут. */
export async function fetchStartedCourses(): Promise<StartedCourse[]> {
  const courses = await listCourses()
  const rows = await Promise.all(
    courses.map(async (course) => ({ course, item: await getCourseProgress(course.slug) })),
  )
  return rows
    .filter(({ item }) => item.completedLessons > 0)
    .map(({ course, item }) => ({
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      completed: item.completedLessons,
      total: item.totalLessons,
    }))
    .sort((a, b) => b.completed / (b.total || 1) - a.completed / (a.total || 1))
}

/** `fetch: false` — только читать кеш (сайдбар не должен сам запускать N запросов). */
export function useStartedCoursesQuery(options: { fetch?: boolean } = {}) {
  const auth = useAuthStore()
  const query = useQuery({
    queryKey: computed(() => learningKeys.started(auth.user?.id ?? 'guest')),
    queryFn: fetchStartedCourses,
    enabled: computed(() => auth.isAuthenticated && (options.fetch ?? true)),
  })

  const started = computed(() => query.data.value ?? [])
  /** «Продолжить» — только незаконченное: пройденный курс продолжать нечем. */
  const inProgress = computed(() =>
    started.value.filter((course) => course.completed < course.total),
  )
  const finished = computed(() =>
    started.value.filter((course) => course.total > 0 && course.completed >= course.total),
  )
  const completedCount = computed(() =>
    started.value.reduce((sum, course) => sum + course.completed, 0),
  )

  return { ...query, started, inProgress, finished, completedCount }
}

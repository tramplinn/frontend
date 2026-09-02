import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { listCourses } from '@/api/content'
import {
  completeLesson as completeLessonRequest,
  getCourseProgress,
  listLessonProgress,
  listQuizProgress,
  reopenLesson as reopenLessonRequest,
} from '@/api/learning'
import type { CourseProgress } from '@/api/schemas/learning'
import { useAuthStore } from './auth'

export interface StartedCourse {
  slug: string
  title: string
  summary: string | null
  completed: number
  total: number
}

export const useProgressStore = defineStore('progress', () => {
  const completedLessonIds = ref(new Set<string>())
  const passedQuizIds = ref(new Set<string>())
  const courseProgress = ref(new Map<string, CourseProgress>())
  const loaded = ref(false)
  const started = ref<StartedCourse[]>([])
  const startedLoaded = ref(false)
  let progressRequest: Promise<void> | null = null
  let startedRequest: Promise<void> | null = null
  let generation = 0

  const completedCount = computed(() => completedLessonIds.value.size)
  const startedCourses = computed(() => started.value)

  function isCompleted(lessonId: string): boolean {
    return completedLessonIds.value.has(lessonId)
  }

  function isQuizPassed(quizId: string): boolean {
    return passedQuizIds.value.has(quizId)
  }

  async function load(): Promise<void> {
    const auth = useAuthStore()
    if (!auth.isAuthenticated || loaded.value) {
      return
    }
    if (!progressRequest) {
      const requestGeneration = generation
      const request = Promise.all([listLessonProgress(), listQuizProgress()])
        .then(([lessons, quizzes]) => {
          if (requestGeneration !== generation) return
          completedLessonIds.value = new Set(lessons.map((item) => item.lessonId))
          passedQuizIds.value = new Set(
            quizzes.filter((item) => item.passed).map((item) => item.quizId),
          )
          loaded.value = true
        })
        .finally(() => {
          if (progressRequest === request) progressRequest = null
        })
      progressRequest = request
    }
    return progressRequest
  }

  async function loadCourseProgress(courseSlug: string): Promise<CourseProgress | null> {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      return null
    }
    const requestGeneration = generation
    const progress = await getCourseProgress(courseSlug)
    if (requestGeneration === generation) {
      courseProgress.value.set(courseSlug, progress)
    }
    return progress
  }

  async function markCompleted(lessonId: string, courseSlug?: string): Promise<void> {
    await completeLessonRequest(lessonId)
    completedLessonIds.value = new Set(completedLessonIds.value).add(lessonId)
    if (courseSlug !== undefined) {
      await loadCourseProgress(courseSlug)
    }
  }

  async function markReopened(lessonId: string, courseSlug?: string): Promise<void> {
    await reopenLessonRequest(lessonId)
    const next = new Set(completedLessonIds.value)
    next.delete(lessonId)
    completedLessonIds.value = next
    if (courseSlug !== undefined) {
      await loadCourseProgress(courseSlug)
    }
  }

  /** Эндпоинта «мои курсы» на бэкенде нет: агрегат собирается запросом на курс.
      Для колледжа это единицы запросов, при росте каталога нужен свой роут. */
  async function loadStarted(): Promise<void> {
    const auth = useAuthStore()
    if (!auth.isAuthenticated || startedLoaded.value) {
      return
    }
    if (!startedRequest) {
      const requestGeneration = generation
      const request = listCourses()
        .then((courses) =>
          Promise.all(
            courses.map(async (course) => {
              const item = await loadCourseProgress(course.slug)
              return { course, item }
            }),
          ),
        )
        .then((rows) => {
          if (requestGeneration !== generation) return
          started.value = rows
            .filter(({ item }) => item !== null && item.completedLessons > 0)
            .map(({ course, item }) => ({
              slug: course.slug,
              title: course.title,
              summary: course.summary,
              completed: item?.completedLessons ?? 0,
              total: item?.totalLessons ?? 0,
            }))
            .sort((a, b) => b.completed / (b.total || 1) - a.completed / (a.total || 1))
          startedLoaded.value = true
        })
        .finally(() => {
          if (startedRequest === request) startedRequest = null
        })
      startedRequest = request
    }
    return startedRequest
  }

  function reset(): void {
    generation += 1
    completedLessonIds.value = new Set()
    passedQuizIds.value = new Set()
    courseProgress.value = new Map()
    loaded.value = false
    started.value = []
    startedLoaded.value = false
    progressRequest = null
    startedRequest = null
  }

  return {
    completedLessonIds,
    courseProgress,
    completedCount,
    startedCourses,
    isCompleted,
    isQuizPassed,
    load,
    loadStarted,
    loadCourseProgress,
    markCompleted,
    markReopened,
    reset,
  }
})

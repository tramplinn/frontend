import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  completeLesson as completeLessonRequest,
  getCourseProgress,
  listLessonProgress,
  listQuizProgress,
  reopenLesson as reopenLessonRequest,
} from '@/api/learning'
import type { CourseProgress } from '@/api/schemas/learning'
import { learningKeys } from '@/features/learning/queries'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from './auth'

export const useProgressStore = defineStore('progress', () => {
  const completedLessonIds = ref(new Set<string>())
  const passedQuizIds = ref(new Set<string>())
  const courseProgress = ref(new Map<string, CourseProgress>())
  const loaded = ref(false)
  let progressRequest: Promise<void> | null = null
  let generation = 0

  const completedCount = computed(() => completedLessonIds.value.size)
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
    void queryClient.invalidateQueries({ queryKey: learningKeys.all })
    if (courseSlug !== undefined) {
      await loadCourseProgress(courseSlug)
    }
  }

  async function markReopened(lessonId: string, courseSlug?: string): Promise<void> {
    await reopenLessonRequest(lessonId)
    const next = new Set(completedLessonIds.value)
    next.delete(lessonId)
    completedLessonIds.value = next
    void queryClient.invalidateQueries({ queryKey: learningKeys.all })
    if (courseSlug !== undefined) {
      await loadCourseProgress(courseSlug)
    }
  }

  function reset(): void {
    generation += 1
    completedLessonIds.value = new Set()
    passedQuizIds.value = new Set()
    courseProgress.value = new Map()
    loaded.value = false
    progressRequest = null
    queryClient.removeQueries({ queryKey: learningKeys.all })
  }

  return {
    completedLessonIds,
    courseProgress,
    completedCount,
    isCompleted,
    isQuizPassed,
    load,
    loadCourseProgress,
    markCompleted,
    markReopened,
    reset,
  }
})

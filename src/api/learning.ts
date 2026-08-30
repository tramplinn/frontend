import { z } from 'zod'

import { request } from './client'
import {
  courseProgressSchema,
  lessonProgressSchema,
  quizAttemptSchema,
  quizProgressSchema,
} from './schemas/learning'
import type { CourseProgress, LessonProgress, QuizAttempt, QuizProgress } from './schemas/learning'

export function listLessonProgress(): Promise<LessonProgress[]> {
  return request('/progress/lessons', { schema: z.array(lessonProgressSchema) })
}

export function listQuizProgress(): Promise<QuizProgress[]> {
  return request('/progress/quizzes', { schema: z.array(quizProgressSchema) })
}

export function getCourseProgress(courseSlug: string): Promise<CourseProgress> {
  return request(`/courses/${encodeURIComponent(courseSlug)}/progress`, {
    schema: courseProgressSchema,
  })
}

export function completeLesson(lessonId: string): Promise<LessonProgress> {
  return request(`/progress/lessons/${lessonId}`, {
    method: 'PUT',
    schema: lessonProgressSchema,
  })
}

export async function reopenLesson(lessonId: string): Promise<void> {
  await request(`/progress/lessons/${lessonId}`, { method: 'DELETE' })
}

/** Ответы уходят как есть: сравнение только на сервере. Ключ — id вопроса. */
export function submitQuiz(quizId: string, answers: Record<string, unknown>): Promise<QuizAttempt> {
  return request(`/quizzes/${quizId}/attempts`, {
    method: 'POST',
    body: { answers },
    schema: quizAttemptSchema,
  })
}

export function listQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  return request(`/quizzes/${quizId}/attempts`, { schema: z.array(quizAttemptSchema) })
}

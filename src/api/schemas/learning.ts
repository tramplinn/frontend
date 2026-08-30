import { z } from 'zod'

import { dateTimeSchema, uuidSchema } from './common'

export const lessonProgressSchema = z.object({
  lessonId: uuidSchema,
  completedAt: dateTimeSchema,
})

export const quizProgressSchema = z.object({
  quizId: uuidSchema,
  score: z.number().int(),
  maxScore: z.number().int(),
  passed: z.boolean(),
})

export const moduleProgressSchema = z.object({
  moduleId: uuidSchema,
  completedLessons: z.number().int(),
  totalLessons: z.number().int(),
})

export const courseProgressSchema = z.object({
  courseId: uuidSchema,
  completedLessons: z.number().int(),
  totalLessons: z.number().int(),
  modules: z.array(moduleProgressSchema),
})

export const questionResultSchema = z.object({
  questionId: uuidSchema,
  correct: z.boolean(),
  explanation: z.string().nullable().default(null),
})

export const quizAttemptSchema = z.object({
  id: uuidSchema,
  quizId: uuidSchema,
  score: z.number().int(),
  maxScore: z.number().int(),
  results: z.array(questionResultSchema).default([]),
})

export type LessonProgress = z.infer<typeof lessonProgressSchema>
export type QuizProgress = z.infer<typeof quizProgressSchema>
export type ModuleProgress = z.infer<typeof moduleProgressSchema>
export type CourseProgress = z.infer<typeof courseProgressSchema>
export type QuestionResult = z.infer<typeof questionResultSchema>
export type QuizAttempt = z.infer<typeof quizAttemptSchema>

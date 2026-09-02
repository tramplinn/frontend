import { z } from 'zod'

import { contentStatusSchema, questionTypeSchema, uuidSchema } from './common'
import { assetSchema } from './assets'

export const interviewCardSchema = z.object({
  id: uuidSchema,
  position: z.number().int(),
  questionMd: z.string(),
  answerMd: z.string(),
})

export const lessonSchema = z.object({
  id: uuidSchema,
  moduleId: uuidSchema,
  title: z.string(),
  slug: z.string(),
  estMinutes: z.number().int().nullable(),
  bodyMd: z.string(),
  bodyHtml: z.string(),
  status: contentStatusSchema,
})

export const quizQuestionSchema = z.object({
  id: uuidSchema,
  position: z.number().int(),
  promptMd: z.string(),
  type: questionTypeSchema,
  options: z.array(z.unknown()),
  attachments: z.array(assetSchema).default([]),
})

export const quizSchema = z.object({
  id: uuidSchema,
  moduleId: uuidSchema,
  lessonId: uuidSchema.nullable(),
  title: z.string(),
  slug: z.string(),
  status: contentStatusSchema,
  questions: z.array(quizQuestionSchema).default([]),
})

export const moduleSchema = z.object({
  id: uuidSchema,
  courseId: uuidSchema,
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  position: z.number().int(),
  status: contentStatusSchema,
})

export const moduleItemSchema = z.discriminatedUnion('kind', [
  z.object({
    id: uuidSchema,
    position: z.number().int(),
    kind: z.literal('lesson'),
    lesson: lessonSchema,
  }),
  z.object({
    id: uuidSchema,
    position: z.number().int(),
    kind: z.literal('quiz'),
    quiz: quizSchema,
  }),
  z.object({
    id: uuidSchema,
    position: z.number().int(),
    kind: z.literal('practice'),
    practiceSet: z.object({
      id: uuidSchema,
      title: z.string(),
      description: z.string(),
      mode: z.enum(['practice', 'mock_interview']),
      durationMinutes: z.number().int().nullable(),
      status: contentStatusSchema,
    }),
  }),
])

export const moduleTreeSchema = moduleSchema.extend({
  items: z.array(moduleItemSchema).default([]),
})

export const courseSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  color: z.string().nullable(),
  estHours: z.number().int().nullable(),
  coverAssetId: uuidSchema.nullable(),
  coverUrl: z.url().nullable(),
  status: contentStatusSchema,
})

export const courseTreeSchema = courseSchema.extend({
  modules: z.array(moduleTreeSchema).default([]),
})

export const trackCourseSchema = z.object({
  position: z.number().int(),
  course: courseSchema,
})

export const trackSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  coverAssetId: uuidSchema.nullable(),
  coverUrl: z.url().nullable(),
  status: contentStatusSchema,
  courses: z.array(trackCourseSchema).default([]),
})

export const interviewCardPreviewSchema = z.object({
  position: z.number().int(),
  questionMd: z.string(),
  answerMd: z.string(),
})

export const markdownPreviewSchema = z.object({
  bodyHtml: z.string(),
  interviewCards: z.array(interviewCardPreviewSchema).default([]),
})

export const moduleDependencySchema = z.object({
  moduleId: uuidSchema,
  dependsOnId: uuidSchema,
})

export const quizQuestionAuthorSchema = quizQuestionSchema.extend({
  answer: z.record(z.string(), z.unknown()),
  explainMd: z.string().nullable(),
})

export const quizAuthorSchema = quizSchema.extend({
  questions: z.array(quizQuestionAuthorSchema).default([]),
})

export type InterviewCard = z.infer<typeof interviewCardSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type Quiz = z.infer<typeof quizSchema>
export type Module = z.infer<typeof moduleSchema>
export type ModuleItem = z.infer<typeof moduleItemSchema>
export type ModuleTree = z.infer<typeof moduleTreeSchema>
export type QuizQuestionAuthor = z.infer<typeof quizQuestionAuthorSchema>
export type QuizAuthor = z.infer<typeof quizAuthorSchema>
export type Course = z.infer<typeof courseSchema>
export type CourseTree = z.infer<typeof courseTreeSchema>
export type TrackCourse = z.infer<typeof trackCourseSchema>
export type Track = z.infer<typeof trackSchema>
export type ModuleDependency = z.infer<typeof moduleDependencySchema>
export type InterviewCardPreview = z.infer<typeof interviewCardPreviewSchema>
export type MarkdownPreview = z.infer<typeof markdownPreviewSchema>

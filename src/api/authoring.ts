import { z } from 'zod'

import { snakeBody } from './case'
import { request } from './client'
import type { ContentStatus, QuestionType } from './schemas/common'
import {
  courseSchema,
  courseTreeSchema,
  lessonSchema,
  markdownPreviewSchema,
  moduleDependencySchema,
  moduleSchema,
  moduleTreeSchema,
  quizAuthorSchema,
  quizQuestionSchema,
  quizSchema,
  trackSchema,
} from './schemas/content'
import type {
  Course,
  CourseTree,
  Lesson,
  MarkdownPreview,
  Module,
  ModuleDependency,
  ModuleTree,
  Quiz,
  QuizAuthor,
  QuizQuestion,
  Track,
} from './schemas/content'

export function listDraftTracks(): Promise<Track[]> {
  return request('/authoring/tracks', { schema: z.array(trackSchema) })
}

export interface TrackDraft {
  title: string
  slug: string
  description?: string | null
  color?: string | null
  status?: ContentStatus
}

export function createTrack(draft: TrackDraft): Promise<Track> {
  return request('/authoring/tracks', {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: trackSchema,
  })
}

export function updateTrack(trackId: string, changes: Partial<TrackDraft>): Promise<Track> {
  return request(`/authoring/tracks/${trackId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: trackSchema,
  })
}

export async function deleteTrack(trackId: string): Promise<void> {
  await request(`/authoring/tracks/${trackId}`, { method: 'DELETE' })
}

export async function attachCourse(trackId: string, courseId: string): Promise<void> {
  await request(`/authoring/tracks/${trackId}/courses/${courseId}`, { method: 'PUT' })
}

export async function detachCourse(trackId: string, courseId: string): Promise<void> {
  await request(`/authoring/tracks/${trackId}/courses/${courseId}`, { method: 'DELETE' })
}

export async function reorderTrackCourses(trackId: string, courseIds: string[]): Promise<void> {
  await request(`/authoring/tracks/${trackId}/courses/order`, {
    method: 'PUT',
    body: { course_ids: courseIds },
  })
}

export function listDraftCourses(): Promise<Course[]> {
  return request('/authoring/courses', { schema: z.array(courseSchema) })
}

export function getDraftCourse(slug: string): Promise<CourseTree> {
  return request(`/authoring/courses/${encodeURIComponent(slug)}`, { schema: courseTreeSchema })
}

export interface CourseDraft {
  title: string
  slug: string
  summary?: string | null
  color?: string | null
  estHours?: number | null
  coverAssetId?: string | null
  status?: ContentStatus
  tags?: string[]
}

export function createCourse(draft: CourseDraft): Promise<Course> {
  return request('/authoring/courses', {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: courseSchema,
  })
}

export function updateCourse(courseId: string, changes: Partial<CourseDraft>): Promise<Course> {
  return request(`/authoring/courses/${courseId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: courseSchema,
  })
}

export async function deleteCourse(courseId: string): Promise<void> {
  await request(`/authoring/courses/${courseId}`, { method: 'DELETE' })
}

export function listDraftModuleDependencies(slug: string): Promise<ModuleDependency[]> {
  return request(`/authoring/courses/${encodeURIComponent(slug)}/module-dependencies`, {
    schema: z.array(moduleDependencySchema),
  })
}

export interface ModuleDraft {
  title: string
  slug: string
  position: number
  summary?: string | null
  status?: ContentStatus
}

export function getDraftModule(moduleId: string): Promise<ModuleTree> {
  return request(`/authoring/modules/${moduleId}`, { schema: moduleTreeSchema })
}

export function createModule(courseId: string, draft: ModuleDraft): Promise<Module> {
  return request(`/authoring/courses/${courseId}/modules`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: moduleSchema,
  })
}

export function updateModule(moduleId: string, changes: Partial<ModuleDraft>): Promise<Module> {
  return request(`/authoring/modules/${moduleId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: moduleSchema,
  })
}

/** Порядок целиком: UNIQUE (parent, position) отложен, по одному PATCH будет 409. */
export async function reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
  await request(`/authoring/courses/${courseId}/modules/order`, {
    method: 'PUT',
    body: { ids: moduleIds },
  })
}

export async function deleteModule(moduleId: string): Promise<void> {
  await request(`/authoring/modules/${moduleId}`, { method: 'DELETE' })
}

export async function addModuleDependency(moduleId: string, dependsOnId: string): Promise<void> {
  await request(`/authoring/modules/${moduleId}/dependencies/${dependsOnId}`, {
    method: 'PUT',
  })
}

export async function removeModuleDependency(moduleId: string, dependsOnId: string): Promise<void> {
  await request(`/authoring/modules/${moduleId}/dependencies/${dependsOnId}`, {
    method: 'DELETE',
  })
}

export interface LessonDraft {
  title: string
  slug: string
  estMinutes?: number | null
  bodyMd?: string
  status?: ContentStatus
}

export function getDraftLesson(lessonId: string): Promise<Lesson> {
  return request(`/authoring/lessons/${lessonId}`, { schema: lessonSchema })
}

export function createLesson(moduleId: string, draft: LessonDraft): Promise<Lesson> {
  return request(`/authoring/modules/${moduleId}/lessons`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: lessonSchema,
  })
}

export function updateLesson(lessonId: string, changes: Partial<LessonDraft>): Promise<Lesson> {
  return request(`/authoring/lessons/${lessonId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: lessonSchema,
  })
}

export async function reorderModuleItems(moduleId: string, itemIds: string[]): Promise<void> {
  await request(`/authoring/modules/${moduleId}/order`, {
    method: 'PUT',
    body: { ids: itemIds },
  })
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await request(`/authoring/lessons/${lessonId}`, { method: 'DELETE' })
}

export function previewMarkdown(bodyMd: string): Promise<MarkdownPreview> {
  return request('/authoring/markdown/preview', {
    method: 'POST',
    body: { body_md: bodyMd },
    schema: markdownPreviewSchema,
  })
}

export interface QuizDraft {
  title: string
  slug: string
  lessonId?: string | null
  status?: ContentStatus
}

export function getDraftQuiz(quizId: string): Promise<QuizAuthor> {
  return request(`/authoring/quizzes/${quizId}`, { schema: quizAuthorSchema })
}

export function createQuiz(moduleId: string, draft: QuizDraft): Promise<Quiz> {
  return request(`/authoring/modules/${moduleId}/quizzes`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: quizSchema,
  })
}

export function updateQuiz(quizId: string, changes: Partial<QuizDraft>): Promise<Quiz> {
  return request(`/authoring/quizzes/${quizId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: quizSchema,
  })
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await request(`/authoring/quizzes/${quizId}`, { method: 'DELETE' })
}

export interface QuestionDraft {
  position: number
  promptMd: string
  type: QuestionType
  options: unknown[]
  answer: Record<string, unknown>
  explainMd?: string | null
  attachmentIds?: string[]
}

export function createQuestion(quizId: string, draft: QuestionDraft): Promise<QuizQuestion> {
  return request(`/authoring/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: quizQuestionSchema,
  })
}

export function updateQuestion(
  questionId: string,
  changes: Partial<QuestionDraft>,
): Promise<QuizQuestion> {
  return request(`/authoring/questions/${questionId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: quizQuestionSchema,
  })
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await request(`/authoring/questions/${questionId}`, { method: 'DELETE' })
}

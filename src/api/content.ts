import { z } from 'zod'

import { fetchAllPages, request } from './client'
import {
  coursePageSchema,
  courseTreeSchema,
  interviewCardSchema,
  lessonSchema,
  moduleDependencySchema,
  quizSchema,
  trackPageSchema,
} from './schemas/content'
import type {
  Course,
  CourseTree,
  InterviewCard,
  Lesson,
  ModuleDependency,
  Quiz,
  Track,
} from './schemas/content'

export function listTracks(): Promise<Track[]> {
  return fetchAllPages('/tracks', trackPageSchema)
}

export function listCourses(): Promise<Course[]> {
  return fetchAllPages('/courses', coursePageSchema)
}

export function getCourse(slug: string): Promise<CourseTree> {
  return request(`/courses/${encodeURIComponent(slug)}`, { schema: courseTreeSchema })
}

export function listModuleDependencies(courseSlug: string): Promise<ModuleDependency[]> {
  return request(`/courses/${encodeURIComponent(courseSlug)}/module-dependencies`, {
    schema: z.array(moduleDependencySchema),
  })
}

export function getLesson(lessonId: string): Promise<Lesson> {
  return request(`/lessons/${lessonId}`, { schema: lessonSchema })
}

export function listInterviewCards(lessonId: string): Promise<InterviewCard[]> {
  return request(`/lessons/${lessonId}/interview-cards`, { schema: z.array(interviewCardSchema) })
}

export function getQuiz(quizId: string): Promise<Quiz> {
  return request(`/quizzes/${quizId}`, { schema: quizSchema })
}

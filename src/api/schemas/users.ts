import { z } from 'zod'

import { pageSchema, uuidSchema } from './common'
import { companySchema, interestSchema, universitySchema } from './directories'
import { profileBlockSchema, projectCardSchema } from './projects'

export const specialtySchema = z.enum([
  'frontend',
  'backend',
  'fullstack',
  'mobile',
  'data',
  'devops',
  'qa',
])
export const developerGradeSchema = z.enum(['learning', 'junior', 'middle', 'senior'])

export const publicUserSchema = z.object({
  id: uuidSchema,
  login: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  headline: z.string().nullable(),
  specialty: specialtySchema.nullable(),
  grade: developerGradeSchema.nullable(),
  experienceYears: z.number().int().nullable(),
  company: companySchema.nullable(),
  university: universitySchema.nullable(),
  interests: z.array(interestSchema),
})

export const courseActivitySchema = z.object({
  slug: z.string(),
  title: z.string(),
  color: z.string().nullable(),
  completedLessons: z.number().int(),
  totalLessons: z.number().int(),
})

export const publicProfileSchema = publicUserSchema.extend({
  bio: z.string().nullable(),
  // Скрытые пользователем блоки бэкенд не отдаёт: статистика приходит null.
  completedLessons: z.number().int().nullable(),
  passedQuizzes: z.number().int().nullable(),
  solvedAlgorithms: z.number().int().nullable(),
  activeCourses: z.array(courseActivitySchema),
  resumeUrl: z.string().nullable(),
  layout: z.array(profileBlockSchema),
  projects: z.array(projectCardSchema),
})

export const publicUserPageSchema = pageSchema(publicUserSchema)

export type Specialty = z.infer<typeof specialtySchema>
export type DeveloperGrade = z.infer<typeof developerGradeSchema>
export type PublicUser = z.infer<typeof publicUserSchema>
export type PublicProfile = z.infer<typeof publicProfileSchema>
export type PublicUserPage = z.infer<typeof publicUserPageSchema>

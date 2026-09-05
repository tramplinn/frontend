import { z } from 'zod'

import { uuidSchema } from './common'
import { algorithmDifficultySchema } from './algorithms'
import { tagSchema } from './tags'

export const recommendedCourseSchema = z.object({
  id: uuidSchema,
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  estHours: z.number().int().nullable(),
  tags: z.array(tagSchema),
})

export const recommendedAlgorithmSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  difficulty: algorithmDifficultySchema,
  tags: z.array(tagSchema),
})

export const recommendationsSchema = z.object({
  courses: z.array(recommendedCourseSchema),
  algorithms: z.array(recommendedAlgorithmSchema),
})

export type RecommendedCourse = z.infer<typeof recommendedCourseSchema>
export type RecommendedAlgorithm = z.infer<typeof recommendedAlgorithmSchema>
export type Recommendations = z.infer<typeof recommendationsSchema>

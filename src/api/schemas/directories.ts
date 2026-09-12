import { z } from 'zod'

import { uuidSchema } from './common'

export const companySchema = z.object({
  id: uuidSchema,
  name: z.string(),
})

export const universitySchema = z.object({
  id: uuidSchema,
  name: z.string(),
})

export const interestSchema = z.object({
  id: uuidSchema,
  name: z.string(),
})

export type Company = z.infer<typeof companySchema>
export type University = z.infer<typeof universitySchema>
export type Interest = z.infer<typeof interestSchema>

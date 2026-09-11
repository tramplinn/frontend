import { z } from 'zod'

export const uuidSchema = z.uuid()

export const dateTimeSchema = z.iso.datetime({ offset: true })

export const contentStatusSchema = z.enum(['draft', 'published'])
export const userRoleSchema = z.enum(['student', 'teacher', 'admin'])
export const questionTypeSchema = z.enum([
  'single',
  'multiple',
  'text',
  'matching',
  'grouping',
  'file',
])
export const identityProviderSchema = z.enum(['github', 'yandex', 'gitlab', 'email'])

export type ContentStatus = z.infer<typeof contentStatusSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type QuestionType = z.infer<typeof questionTypeSchema>
export type IdentityProvider = z.infer<typeof identityProviderSchema>

export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).default({}),
})

export type ApiErrorBody = z.infer<typeof errorSchema>

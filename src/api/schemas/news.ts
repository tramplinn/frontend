import { z } from 'zod'

import { assetSchema } from './assets'
import { contentStatusSchema, dateTimeSchema, pageSchema, uuidSchema } from './common'

export const newsSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  bodyMd: z.string(),
  status: contentStatusSchema,
  publishedAt: dateTimeSchema.nullable(),
  photos: z.array(assetSchema),
})

export const newsPageSchema = pageSchema(newsSchema)

export type News = z.infer<typeof newsSchema>
export type NewsPage = z.infer<typeof newsPageSchema>

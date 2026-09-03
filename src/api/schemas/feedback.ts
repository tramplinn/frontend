import { z } from 'zod'

import { assetSchema } from './assets'
import { dateTimeSchema, uuidSchema } from './common'

export const feedbackSchema = z.object({
  id: uuidSchema,
  authorId: uuidSchema.nullable(),
  message: z.string(),
  pagePath: z.string().nullable(),
  status: z.enum(['new', 'resolved']),
  attachments: z.array(assetSchema),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})

export type Feedback = z.infer<typeof feedbackSchema>

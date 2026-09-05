import { z } from 'zod'

import { uuidSchema } from './common'

export const tagSchema = z.object({
  id: uuidSchema,
  name: z.string(),
})

export type Tag = z.infer<typeof tagSchema>

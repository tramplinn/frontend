import type { z } from 'zod'

import { userSchema } from './auth'
import { pageSchema } from './common'

export const userPageSchema = pageSchema(userSchema)

export type UserPage = z.infer<typeof userPageSchema>

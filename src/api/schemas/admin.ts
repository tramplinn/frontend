import { z } from 'zod'

import { userSchema } from './auth'
import { pageSchema } from './common'
export {
  assetMimeSchema,
  assetPageSchema,
  assetSchema,
  type Asset,
  type AssetMime,
  type AssetPage,
} from './assets'

export const studentGroupSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  year: z.number().int(),
})

export const userPageSchema = pageSchema(userSchema)

export type StudentGroup = z.infer<typeof studentGroupSchema>
export type UserPage = z.infer<typeof userPageSchema>

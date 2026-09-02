import type { z } from 'zod'

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

export const userPageSchema = pageSchema(userSchema)

export type UserPage = z.infer<typeof userPageSchema>

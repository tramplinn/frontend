import { z } from 'zod'

import { pageSchema, uuidSchema } from './common'

/** Whitelist повторяет серверный; SVG исключён из-за исполняемого содержимого. */
export const assetMimeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
])

export const assetSchema = z.object({
  id: uuidSchema,
  filename: z.string(),
  mime: assetMimeSchema,
  size: z.number().int(),
  url: z.url(),
})

export const assetPageSchema = pageSchema(assetSchema)

export type AssetMime = z.infer<typeof assetMimeSchema>
export type Asset = z.infer<typeof assetSchema>
export type AssetPage = z.infer<typeof assetPageSchema>

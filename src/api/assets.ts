import { request } from './client'
import { assetSchema, type Asset, type AssetMime } from './schemas/assets'

export function uploadAsset(file: File, mime: AssetMime): Promise<Asset> {
  return request('/assets', {
    method: 'POST',
    query: { filename: file.name, mime },
    rawBody: { data: file, contentType: 'application/octet-stream' },
    schema: assetSchema,
  })
}

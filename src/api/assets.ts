import { request } from './client'
import { assetSchema, type Asset, type AssetMime } from './schemas/assets'

export function uploadAsset(file: File, mime: AssetMime): Promise<Asset> {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('mime', mime)
  return request('/assets', {
    method: 'POST',
    formData,
    schema: assetSchema,
  })
}

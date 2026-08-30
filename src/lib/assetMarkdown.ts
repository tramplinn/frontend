import type { Asset } from '@/api/schemas/admin'

export function assetMarkdown(asset: Asset): string {
  const label = asset.filename.replace(/\.[^.]+$/, '') || asset.filename
  return asset.mime === 'application/pdf' ? `[${label}](${asset.url})` : `![${label}](${asset.url})`
}

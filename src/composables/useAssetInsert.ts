import { ref } from 'vue'
import type { Ref } from 'vue'

import { uploadAsset } from '@/api/assets'
import { assetMimeSchema } from '@/api/schemas/assets'
import { assetMarkdown } from '@/lib/assetMarkdown'

type Replace = (placeholder: string, markdown: string) => void
type Insert = (text: string) => void

export interface AssetInsert {
  uploading: Ref<boolean>
  dragging: Ref<boolean>
  error: Ref<string | null>
  onPaste: (event: ClipboardEvent) => void
  onDrop: (event: DragEvent) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: () => void
}

const ACCEPTED = assetMimeSchema.options.join(', ')

export function useAssetInsert(insert: Insert, replace: Replace): AssetInsert {
  const uploading = ref(false)
  const dragging = ref(false)
  const error = ref<string | null>(null)

  async function handle(files: File[]): Promise<void> {
    if (files.length === 0) {
      return
    }
    error.value = null
    uploading.value = true
    try {
      for (const file of files) {
        const mime = assetMimeSchema.safeParse(file.type)
        if (!mime.success) {
          error.value = `Тип ${file.type || 'неизвестен'} не разрешён. Можно: ${ACCEPTED}`
          continue
        }
        const named =
          file.name === ''
            ? new File([file], `вставка-${String(Date.now())}.png`, { type: file.type })
            : file
        const placeholder = `![загружаю ${named.name}…]()`
        insert(placeholder)
        try {
          const asset = await uploadAsset(named, mime.data)
          replace(placeholder, assetMarkdown(asset))
        } catch {
          replace(placeholder, '')
          error.value = `Не удалось загрузить ${named.name}`
        }
      }
    } finally {
      uploading.value = false
    }
  }

  function onPaste(event: ClipboardEvent): void {
    const files = [...(event.clipboardData?.files ?? [])]
    if (files.length === 0) {
      return
    }
    event.preventDefault()
    void handle(files)
  }

  function onDrop(event: DragEvent): void {
    dragging.value = false
    const files = [...(event.dataTransfer?.files ?? [])]
    if (files.length === 0) {
      return
    }
    event.preventDefault()
    void handle(files)
  }

  function onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('Files') !== true) {
      return
    }

    event.preventDefault()
    dragging.value = true
  }

  function onDragLeave(): void {
    dragging.value = false
  }

  return { uploading, dragging, error, onPaste, onDrop, onDragOver, onDragLeave }
}

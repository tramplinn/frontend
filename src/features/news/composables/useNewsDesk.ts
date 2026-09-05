import { onMounted, ref } from 'vue'

import { uploadAsset } from '@/api/assets'
import { createNews, deleteNews, listNewsDrafts, updateNews } from '@/api/news'
import type { NewsDraft } from '@/api/news'
import type { Asset } from '@/api/schemas/assets'
import { assetMimeSchema } from '@/api/schemas/assets'
import type { News } from '@/api/schemas/news'
import { runBusyAction } from '@/lib/asyncAction'
import { errorText } from '@/lib/errors'

const IMAGE_MIMES = assetMimeSchema.options.filter((mime) => mime.startsWith('image/'))

export function useNewsDesk() {
  const items = ref<News[]>([])
  const pending = ref(true)
  const error = ref<unknown>(null)
  const actionError = ref<string | null>(null)
  const busy = ref(false)
  const editing = ref<string | null>(null)

  async function reload(): Promise<void> {
    items.value = (await listNewsDrafts()).items
  }

  async function load(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await reload()
    } catch (cause) {
      error.value = cause
    } finally {
      pending.value = false
    }
  }

  async function run(action: () => Promise<unknown>): Promise<void> {
    await runBusyAction(
      {
        setBusy: (active) => (busy.value = active),
        clearError: () => (actionError.value = null),
        setError: (cause) => (actionError.value = errorText(cause)),
      },
      async () => {
        await action()
        await reload()
      },
    )
  }

  function add(draft: NewsDraft): void {
    void run(() => createNews(draft))
  }

  function save(newsId: string, changes: Partial<NewsDraft>): void {
    void run(async () => {
      await updateNews(newsId, changes)
      editing.value = null
    })
  }

  function remove(newsId: string): void {
    void run(() => deleteNews(newsId))
  }

  function togglePublished(news: News): void {
    void run(() =>
      updateNews(news.id, { status: news.status === 'published' ? 'draft' : 'published' }),
    )
  }

  function toggleEditing(newsId: string): void {
    editing.value = editing.value === newsId ? null : newsId
  }

  function attachPhotos(news: News, files: File[]): void {
    void run(async () => {
      const accepted: Asset[] = []
      for (const file of files) {
        const mime = assetMimeSchema.safeParse(file.type)
        if (!mime.success || !IMAGE_MIMES.includes(mime.data)) {
          throw new Error(`${file.name}: нужно изображение (${IMAGE_MIMES.join(', ')})`)
        }
        accepted.push(await uploadAsset(file, mime.data))
      }
      if (accepted.length > 0) {
        await updateNews(news.id, {
          photoIds: [...news.photos.map((photo) => photo.id), ...accepted.map((one) => one.id)],
        })
      }
    })
  }

  function detachPhoto(news: News, assetId: string): void {
    const photoIds = news.photos.filter((one) => one.id !== assetId).map((one) => one.id)
    void run(() => updateNews(news.id, { photoIds }))
  }

  function movePhoto(news: News, index: number, delta: number): void {
    const photoIds = news.photos.map((one) => one.id)
    const target = index + delta
    const moved = photoIds[index]
    const displaced = photoIds[target]
    if (moved === undefined || displaced === undefined) return
    photoIds[index] = displaced
    photoIds[target] = moved
    void run(() => updateNews(news.id, { photoIds }))
  }

  onMounted(() => void load())

  return {
    items,
    pending,
    error,
    actionError,
    busy,
    editing,
    load,
    add,
    save,
    remove,
    togglePublished,
    toggleEditing,
    attachPhotos,
    detachPhoto,
    movePhoto,
  }
}

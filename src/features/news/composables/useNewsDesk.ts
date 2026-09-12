import { onMounted, ref } from 'vue'

import { createNews, deleteNews, listNewsDrafts, updateNews } from '@/api/news'
import type { NewsDraft } from '@/api/news'
import type { News } from '@/api/schemas/news'
import { runBusyAction } from '@/lib/asyncAction'
import { errorText } from '@/lib/errors'

export function useNewsDesk() {
  const items = ref<News[]>([])
  const pending = ref(true)
  const error = ref<unknown>(null)
  const actionError = ref<string | null>(null)
  const busy = ref(false)

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

  function remove(newsId: string): void {
    void run(() => deleteNews(newsId))
  }

  function togglePublished(news: News): void {
    void run(() =>
      updateNews(news.id, { status: news.status === 'published' ? 'draft' : 'published' }),
    )
  }

  onMounted(() => void load())

  return {
    items,
    pending,
    error,
    actionError,
    busy,
    load,
    add,
    remove,
    togglePublished,
  }
}

import { computed, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'

import { uploadAsset } from '@/api/assets'
import { getDraftNews, updateNews } from '@/api/news'
import type { Asset } from '@/api/schemas/assets'
import { assetMimeSchema } from '@/api/schemas/assets'
import type { News } from '@/api/schemas/news'
import { useAssetInsert } from '@/composables/useAssetInsert'
import { useCursorInsert } from '@/composables/useCursorInsert'
import { useDebounce } from '@/composables/useDebounce'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import { runBusyAction } from '@/lib/asyncAction'
import { errorText } from '@/lib/errors'
import { renderMarkdown } from '@/lib/markdown'
import { translate } from '@/i18n'

const AUTOSAVE_DEBOUNCE_MS = 700
const IMAGE_MIMES = assetMimeSchema.options.filter((mime) => mime.startsWith('image/'))

export function useNewsEditor(newsId: MaybeRefOrGetter<string>) {
  const loaded = ref<News | null>(null)
  const title = ref('')
  const summary = ref('')
  const bodyMd = ref('')
  const pending = ref(true)
  const error = ref<unknown>(null)
  const saving = ref(false)
  const saveError = ref<unknown>(null)
  const actionError = ref<string | null>(null)
  const busy = ref(false)
  const savedAt = ref<Date | null>(null)
  const autosaveCount = ref(0)
  const source = ref<HTMLTextAreaElement | null>(null)

  const loadGuard = useVersionedLoad()
  const autosaveDebounce = useDebounce(AUTOSAVE_DEBOUNCE_MS)
  let syncing = false
  let saveQueue: Promise<void> = Promise.resolve()

  const autosaving = computed(() => autosaveCount.value > 0)
  const html = computed(() => (bodyMd.value ? renderMarkdown(bodyMd.value) : ''))

  const dirty = computed(
    () =>
      loaded.value !== null &&
      (title.value !== loaded.value.title ||
        summary.value !== (loaded.value.summary ?? '') ||
        bodyMd.value !== loaded.value.bodyMd),
  )

  async function load(): Promise<void> {
    const version = loadGuard.start()
    autosaveDebounce.cancel()
    pending.value = true
    error.value = null
    loaded.value = null
    try {
      const fetched = await getDraftNews(toValue(newsId))
      if (!loadGuard.isCurrent(version)) return
      syncing = true
      loaded.value = fetched
      title.value = fetched.title
      summary.value = fetched.summary ?? ''
      bodyMd.value = fetched.bodyMd
      savedAt.value = null
      syncing = false
    } catch (cause) {
      if (loadGuard.isCurrent(version)) error.value = cause
    } finally {
      if (loadGuard.isCurrent(version)) pending.value = false
    }
  }

  /** Параллельные вызовы (автосейв + явное действие) выстраиваются в очередь,
      иначе два PATCH одновременно могли бы затереть результат друг друга. */
  function enqueueSave(action: () => Promise<void>): Promise<boolean> {
    let succeeded = false
    const task = saveQueue.then(async () => {
      autosaveCount.value += 1
      saveError.value = null
      try {
        await action()
        savedAt.value = new Date()
        succeeded = true
      } catch (cause) {
        saveError.value = cause
      } finally {
        autosaveCount.value -= 1
      }
    })
    saveQueue = task
    return task.then(() => succeeded)
  }

  /** Сохраняет только название/анонс/текст — смену статуса делает setStatus().
      Пустое название бэкенд отклонит (min_length=1) — ждём, не шлём сразу
      после того, как его стёрли, чтобы перепечатать. */
  async function saveContent(): Promise<boolean> {
    if (!dirty.value) return true
    if (!title.value.trim()) return false
    const current = loaded.value
    if (!current) return true
    return enqueueSave(async () => {
      if (!dirty.value || !title.value.trim()) return
      const saved = await updateNews(current.id, {
        title: title.value,
        summary: summary.value.trim() === '' ? null : summary.value,
        bodyMd: bodyMd.value,
      })
      const latest = loaded.value
      if (!latest || latest.id !== saved.id) return
      latest.title = saved.title
      latest.summary = saved.summary
      latest.bodyMd = saved.bodyMd
    })
  }

  function scheduleSave(): void {
    autosaveDebounce.schedule(() => void saveContent())
  }

  async function flushAutosave(): Promise<boolean> {
    autosaveDebounce.cancel()
    return saveContent()
  }

  async function setStatus(status: 'draft' | 'published'): Promise<void> {
    if (!title.value.trim()) {
      saveError.value = new Error(translate('newsEditor.emptyTitle'))
      return
    }
    if (!(await flushAutosave())) return
    const current = loaded.value
    if (!current) return
    await runBusyAction(
      {
        setBusy: (active) => (saving.value = active),
        clearError: () => (saveError.value = null),
        setError: (cause) => (saveError.value = cause),
      },
      async () => {
        const sent = { title: title.value, summary: summary.value, bodyMd: bodyMd.value }
        const saved = await updateNews(current.id, { status })
        syncing = true
        loaded.value = saved
        // Набранное, пока шёл запрос, не затираем: оно уйдёт следующим автосейвом.
        if (title.value === sent.title) title.value = saved.title
        if (summary.value === sent.summary) summary.value = saved.summary ?? ''
        if (bodyMd.value === sent.bodyMd) bodyMd.value = saved.bodyMd
        syncing = false
        savedAt.value = new Date()
      },
    )
  }

  async function runPhotoAction(action: () => Promise<News>): Promise<void> {
    await runBusyAction(
      {
        setBusy: (active) => (busy.value = active),
        clearError: () => (actionError.value = null),
        setError: (cause) => (actionError.value = errorText(cause)),
      },
      async () => {
        const saved = await action()
        syncing = true
        loaded.value = saved
        syncing = false
      },
    )
  }

  function attachPhotos(files: File[]): void {
    const current = loaded.value
    if (!current) return
    void runPhotoAction(async () => {
      const accepted: Asset[] = []
      for (const file of files) {
        const mime = assetMimeSchema.safeParse(file.type)
        if (!mime.success || !IMAGE_MIMES.includes(mime.data)) {
          throw new Error(
            translate('newsEditor.imageRequired', {
              name: file.name,
              types: IMAGE_MIMES.join(', '),
            }),
          )
        }
        accepted.push(await uploadAsset(file, mime.data))
      }
      return updateNews(current.id, {
        photoIds: [...current.photos.map((photo) => photo.id), ...accepted.map((one) => one.id)],
      })
    })
  }

  function detachPhoto(assetId: string): void {
    const current = loaded.value
    if (!current) return
    const photoIds = current.photos.filter((one) => one.id !== assetId).map((one) => one.id)
    void runPhotoAction(() => updateNews(current.id, { photoIds }))
  }

  function movePhoto(index: number, delta: number): void {
    const current = loaded.value
    if (!current) return
    const photoIds = current.photos.map((one) => one.id)
    const target = index + delta
    const moved = photoIds[index]
    const displaced = photoIds[target]
    if (moved === undefined || displaced === undefined) return
    photoIds[index] = displaced
    photoIds[target] = moved
    void runPhotoAction(() => updateNews(current.id, { photoIds }))
  }

  function setSource(element: Element | ComponentPublicInstance | null): void {
    source.value = element instanceof HTMLTextAreaElement ? element : null
  }

  const { insertAtCursor, replacePlaceholder } = useCursorInsert(
    source,
    () => bodyMd.value,
    (value) => (bodyMd.value = value),
  )

  const assetInsert = useAssetInsert(insertAtCursor, replacePlaceholder)

  useUnsavedChangesGuard(dirty, () => translate('unsaved.news'))

  watch(
    () => toValue(newsId),
    () => void load(),
  )
  watch([title, summary, bodyMd], () => {
    if (!syncing) scheduleSave()
  })

  onMounted(() => {
    void load()
  })
  onUnmounted(() => {
    autosaveDebounce.cancel()
  })

  return {
    actionError,
    assetError: assetInsert.error,
    attachPhotos,
    autosaving,
    bodyMd,
    busy,
    detachPhoto,
    dirty,
    dragging: assetInsert.dragging,
    error,
    html,
    load,
    loaded,
    movePhoto,
    onDragLeave: assetInsert.onDragLeave,
    onDragOver: assetInsert.onDragOver,
    onDrop: assetInsert.onDrop,
    onPaste: assetInsert.onPaste,
    pending,
    saveError,
    savedAt,
    saving,
    setSource,
    setStatus,
    summary,
    title,
    uploadingAsset: assetInsert.uploading,
  }
}

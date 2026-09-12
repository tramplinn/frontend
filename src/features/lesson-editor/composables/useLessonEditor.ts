import { computed, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'

import { getDraftLesson, previewMarkdown, updateLesson } from '@/api/authoring'
import type { InterviewCardPreview, Lesson } from '@/api/schemas/content'
import { useAssetInsert } from '@/composables/useAssetInsert'
import { useCursorInsert } from '@/composables/useCursorInsert'
import { useDebounce } from '@/composables/useDebounce'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import { runBusyAction } from '@/lib/asyncAction'

const PREVIEW_DEBOUNCE_MS = 400
const AUTOSAVE_DEBOUNCE_MS = 700

export function useLessonEditor(lessonId: MaybeRefOrGetter<string>) {
  const loaded = ref<Lesson | null>(null)
  const title = ref('')
  const bodyMd = ref('')
  const html = ref('')
  const cards = ref<InterviewCardPreview[]>([])
  const pending = ref(true)
  const error = ref<unknown>(null)
  const saving = ref(false)
  const previewError = ref<string | null>(null)
  const saveError = ref<unknown>(null)
  const savedAt = ref<Date | null>(null)
  const source = ref<HTMLTextAreaElement | null>(null)
  const autosaveCount = ref(0)

  const loadGuard = useVersionedLoad()
  const previewGuard = useVersionedLoad()
  const previewDebounce = useDebounce(PREVIEW_DEBOUNCE_MS)
  const autosaveDebounce = useDebounce(AUTOSAVE_DEBOUNCE_MS)
  let syncing = false
  let saveQueue: Promise<void> = Promise.resolve()

  const autosaving = computed(() => autosaveCount.value > 0)

  const dirty = computed(
    () =>
      loaded.value !== null &&
      (title.value !== loaded.value.title || bodyMd.value !== loaded.value.bodyMd),
  )

  async function load(): Promise<void> {
    const version = loadGuard.start()
    previewGuard.cancel()
    previewDebounce.cancel()
    autosaveDebounce.cancel()
    pending.value = true
    error.value = null
    loaded.value = null
    try {
      const fetched = await getDraftLesson(toValue(lessonId))
      if (!loadGuard.isCurrent(version)) return
      syncing = true
      loaded.value = fetched
      title.value = fetched.title
      bodyMd.value = fetched.bodyMd
      html.value = fetched.bodyHtml
      cards.value = []
      savedAt.value = null
      syncing = false
    } catch (cause) {
      if (loadGuard.isCurrent(version)) error.value = cause
    } finally {
      if (loadGuard.isCurrent(version)) pending.value = false
    }
  }

  async function refreshPreview(): Promise<void> {
    const version = previewGuard.start()
    previewError.value = null
    try {
      const preview = await previewMarkdown(bodyMd.value)
      if (!previewGuard.isCurrent(version)) return
      html.value = preview.bodyHtml
      cards.value = preview.interviewCards
    } catch {
      if (previewGuard.isCurrent(version)) {
        previewError.value = 'Блок :::interview не разобрался — проверьте разделитель ---'
      }
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

  /** Сохраняет только название и текст — смену статуса делает setStatus().
      Пустое название бэкенд отклонит (min_length=1) — ждём, не шлём сразу
      после того, как его стёрли, чтобы перепечатать. */
  async function saveContent(): Promise<boolean> {
    if (!dirty.value) return true
    if (!title.value.trim()) return false
    const current = loaded.value
    if (!current) return true
    return enqueueSave(async () => {
      if (!dirty.value || !title.value.trim()) return
      const saved = await updateLesson(current.id, {
        title: title.value,
        bodyMd: bodyMd.value,
      })
      const latest = loaded.value
      if (!latest || latest.id !== saved.id) return
      latest.title = saved.title
      latest.bodyMd = saved.bodyMd
      latest.bodyHtml = saved.bodyHtml
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
      saveError.value = new Error('Название урока не может быть пустым')
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
        const saved = await updateLesson(current.id, { status })
        syncing = true
        loaded.value = saved
        title.value = saved.title
        bodyMd.value = saved.bodyMd
        html.value = saved.bodyHtml
        syncing = false
        savedAt.value = new Date()
      },
    )
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

  useUnsavedChangesGuard(dirty, 'Есть несохранённые изменения урока. Уйти со страницы?')

  watch(
    () => toValue(lessonId),
    () => void load(),
  )
  watch(bodyMd, () => {
    previewDebounce.schedule(() => void refreshPreview())
  })
  watch([title, bodyMd], () => {
    if (!syncing) scheduleSave()
  })

  onMounted(() => {
    void load()
  })
  onUnmounted(() => {
    previewDebounce.cancel()
    previewGuard.cancel()
    autosaveDebounce.cancel()
  })

  return {
    assetError: assetInsert.error,
    autosaving,
    bodyMd,
    cards,
    dirty,
    dragging: assetInsert.dragging,
    error,
    html,
    loaded,
    onDragLeave: assetInsert.onDragLeave,
    onDragOver: assetInsert.onDragOver,
    onDrop: assetInsert.onDrop,
    onPaste: assetInsert.onPaste,
    pending,
    previewError,
    saveError,
    savedAt,
    saving,
    setSource,
    setStatus,
    title,
    uploadingAsset: assetInsert.uploading,
  }
}

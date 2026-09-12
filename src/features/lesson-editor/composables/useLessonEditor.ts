import { computed, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'

import { getDraftLesson, previewMarkdown, updateLesson } from '@/api/authoring'
import type { InterviewCardPreview, Lesson } from '@/api/schemas/content'
import { useAssetInsert } from '@/composables/useAssetInsert'
import { useCursorInsert } from '@/composables/useCursorInsert'
import { useDebounce } from '@/composables/useDebounce'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useVersionedLoad } from '@/composables/useVersionedLoad'

const PREVIEW_DEBOUNCE_MS = 400

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

  const loadGuard = useVersionedLoad()
  const previewGuard = useVersionedLoad()
  const previewDebounce = useDebounce(PREVIEW_DEBOUNCE_MS)

  const dirty = computed(
    () =>
      loaded.value !== null &&
      (title.value !== loaded.value.title || bodyMd.value !== loaded.value.bodyMd),
  )

  async function load(): Promise<void> {
    const version = loadGuard.start()
    previewGuard.cancel()
    previewDebounce.cancel()
    pending.value = true
    error.value = null
    loaded.value = null
    try {
      const fetched = await getDraftLesson(toValue(lessonId))
      if (!loadGuard.isCurrent(version)) return
      loaded.value = fetched
      title.value = fetched.title
      bodyMd.value = fetched.bodyMd
      html.value = fetched.bodyHtml
      cards.value = []
      savedAt.value = null
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

  async function save(status?: 'draft' | 'published'): Promise<void> {
    const current = loaded.value
    if (!current) return
    saving.value = true
    saveError.value = null
    try {
      const saved = await updateLesson(current.id, {
        title: title.value,
        bodyMd: bodyMd.value,
        ...(status === undefined ? {} : { status }),
      })
      loaded.value = saved
      title.value = saved.title
      bodyMd.value = saved.bodyMd
      html.value = saved.bodyHtml
      savedAt.value = new Date()
    } catch (cause) {
      saveError.value = cause
    } finally {
      saving.value = false
    }
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

  onMounted(() => {
    void load()
  })
  onUnmounted(() => {
    previewDebounce.cancel()
    previewGuard.cancel()
  })

  return {
    assetError: assetInsert.error,
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
    save,
    saveError,
    savedAt,
    saving,
    setSource,
    title,
    uploadingAsset: assetInsert.uploading,
  }
}

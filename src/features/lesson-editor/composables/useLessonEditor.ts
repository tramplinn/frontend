import { computed, nextTick, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'

import { getDraftLesson, previewMarkdown, updateLesson } from '@/api/authoring'
import type { InterviewCardPreview, Lesson } from '@/api/schemas/content'
import { useAssetInsert } from '@/composables/useAssetInsert'

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

  let loadVersion = 0
  let previewVersion = 0
  let debounce: ReturnType<typeof setTimeout> | undefined

  const dirty = computed(
    () =>
      loaded.value !== null &&
      (title.value !== loaded.value.title || bodyMd.value !== loaded.value.bodyMd),
  )

  async function load(): Promise<void> {
    const version = ++loadVersion
    previewVersion += 1
    clearTimeout(debounce)
    pending.value = true
    error.value = null
    loaded.value = null
    try {
      const fetched = await getDraftLesson(toValue(lessonId))
      if (version !== loadVersion) return
      loaded.value = fetched
      title.value = fetched.title
      bodyMd.value = fetched.bodyMd
      html.value = fetched.bodyHtml
      cards.value = []
      savedAt.value = null
    } catch (cause) {
      if (version === loadVersion) error.value = cause
    } finally {
      if (version === loadVersion) pending.value = false
    }
  }

  async function refreshPreview(): Promise<void> {
    const version = ++previewVersion
    previewError.value = null
    try {
      const preview = await previewMarkdown(bodyMd.value)
      if (version !== previewVersion) return
      html.value = preview.bodyHtml
      cards.value = preview.interviewCards
    } catch {
      if (version === previewVersion) {
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

  function insertAtCursor(text: string): void {
    const field = source.value
    if (!field) {
      bodyMd.value += text
      return
    }
    const start = field.selectionStart
    const end = field.selectionEnd
    bodyMd.value = bodyMd.value.slice(0, start) + text + bodyMd.value.slice(end)
    void nextTick(() => {
      const at = start + text.length
      field.focus()
      field.setSelectionRange(at, at)
    })
  }

  function replacePlaceholder(placeholder: string, markdown: string): void {
    bodyMd.value = bodyMd.value.replace(placeholder, markdown)
  }

  function setSource(element: Element | ComponentPublicInstance | null): void {
    source.value = element instanceof HTMLTextAreaElement ? element : null
  }

  const assetInsert = useAssetInsert(insertAtCursor, replacePlaceholder)

  function guard(event: BeforeUnloadEvent): void {
    if (dirty.value) event.preventDefault()
  }

  watch(
    () => toValue(lessonId),
    () => void load(),
  )
  watch(bodyMd, () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => void refreshPreview(), PREVIEW_DEBOUNCE_MS)
  })

  onMounted(() => {
    void load()
    window.addEventListener('beforeunload', guard)
  })
  onUnmounted(() => {
    clearTimeout(debounce)
    previewVersion += 1
    window.removeEventListener('beforeunload', guard)
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

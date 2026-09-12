import { computed, onMounted, onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import {
  createQuestion,
  deleteQuestion,
  getDraftModule,
  getDraftQuiz,
  updateQuestion,
  updateQuiz,
} from '@/api/authoring'
import { uploadAsset } from '@/api/assets'
import type { QuestionDraft } from '@/api/authoring'
import { assetMimeSchema } from '@/api/schemas/assets'
import type { ModuleTree, QuizAuthor, QuizQuestionAuthor } from '@/api/schemas/content'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import {
  removeQuestionOption,
  toEditableQuestion,
  toQuestionAnswer,
  toQuestionOptions,
  type EditableQuestion,
} from '@/features/quiz-editor/model/questionDraft'

const MODULE_WIDE = 'module'
const AUTOSAVE_DEBOUNCE_MS = 700

export function useQuizEditor(quizId: MaybeRefOrGetter<string>) {
  const loaded = ref<QuizAuthor | null>(null)
  const drafts = ref(new Map<string, EditableQuestion>())
  const pending = ref(true)
  const error = ref<unknown>(null)
  const busy = ref<string | null>(null)
  const autosavingIds = ref(new Set<string>())
  let loadVersion = 0
  const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()
  let saveQueue: Promise<void> = Promise.resolve()

  function clearTimers(): void {
    for (const timer of saveTimers.values()) clearTimeout(timer)
    saveTimers.clear()
  }

  async function load(): Promise<void> {
    clearTimers()
    const version = ++loadVersion
    const targetQuizId = toValue(quizId)
    pending.value = true
    error.value = null
    try {
      const quiz = await getDraftQuiz(targetQuizId)
      if (version !== loadVersion) return
      const loadedModule = await getDraftModule(quiz.moduleId)
      if (version !== loadVersion) return
      loaded.value = quiz
      drafts.value = new Map(quiz.questions.map((item) => [item.id, toEditableQuestion(item)]))
      module.value = loadedModule
    } catch (cause) {
      if (version !== loadVersion) return
      error.value = cause
    } finally {
      if (version === loadVersion) pending.value = false
    }
  }

  function draftOf(questionId: string): EditableQuestion | undefined {
    return drafts.value.get(questionId)
  }

  function isDirty(questionId: string): boolean {
    const question = loaded.value?.questions.find((item) => item.id === questionId)
    const draft = drafts.value.get(questionId)
    if (!question || !draft) return false
    return JSON.stringify(draft) !== JSON.stringify(toEditableQuestion(question))
  }

  function isSaving(questionId: string): boolean {
    return autosavingIds.value.has(questionId)
  }

  function patch(questionId: string, changes: Partial<EditableQuestion>): void {
    const current = draftOf(questionId)
    if (!current) return
    drafts.value = new Map(drafts.value).set(questionId, { ...current, ...changes })
    clearTimeout(saveTimers.get(questionId))
    saveTimers.set(
      questionId,
      setTimeout(() => {
        saveTimers.delete(questionId)
        void saveQuestion(questionId)
      }, AUTOSAVE_DEBOUNCE_MS),
    )
  }

  function toggleCorrect(questionId: string, index: number): void {
    const draft = draftOf(questionId)
    if (!draft) return
    if (draft.type === 'single') {
      patch(questionId, { correct: [index] })
      return
    }
    patch(questionId, {
      correct: draft.correct.includes(index)
        ? draft.correct.filter((item) => item !== index)
        : [...draft.correct, index],
    })
  }

  function setOption(questionId: string, index: number, value: string): void {
    const draft = draftOf(questionId)
    if (draft) {
      patch(questionId, { options: draft.options.map((item, at) => (at === index ? value : item)) })
    }
  }

  function addOption(questionId: string): void {
    const draft = draftOf(questionId)
    if (draft) patch(questionId, { options: [...draft.options, ''] })
  }

  function removeOption(questionId: string, index: number): void {
    const draft = draftOf(questionId)
    if (draft) patch(questionId, removeQuestionOption(draft, index))
  }

  /** Обновляет только сохранённый вопрос — полный load() затирал бы черновики
      всех остальных карточек, которые ещё не нажали «сохранить». */
  function replaceQuestion(question: QuizQuestionAuthor): void {
    const quiz = loaded.value
    if (!quiz) return
    loaded.value = {
      ...quiz,
      questions: quiz.questions.map((item) => (item.id === question.id ? question : item)),
    }
  }

  /** Параллельные сохранения разных вопросов выстраиваются в очередь —
      иначе конкурентные PATCH могли бы прийти на сервер не по порядку. */
  function enqueueSave(questionId: string, action: () => Promise<void>): Promise<boolean> {
    let succeeded = false
    const task = saveQueue.then(async () => {
      autosavingIds.value = new Set(autosavingIds.value).add(questionId)
      error.value = null
      try {
        await action()
        succeeded = true
      } catch (cause) {
        error.value = cause
      } finally {
        const next = new Set(autosavingIds.value)
        next.delete(questionId)
        autosavingIds.value = next
      }
    })
    saveQueue = task
    return task.then(() => succeeded)
  }

  async function saveQuestion(questionId: string): Promise<boolean> {
    if (!isDirty(questionId)) return true
    return enqueueSave(questionId, async () => {
      const draft = draftOf(questionId)
      const question = loaded.value?.questions.find((item) => item.id === questionId)
      if (!draft || !question || !isDirty(questionId)) return
      const answer = toQuestionAnswer(draft)
      const explainMd = draft.explainMd.trim() === '' ? null : draft.explainMd
      const updated = await updateQuestion(questionId, {
        promptMd: draft.promptMd,
        type: draft.type,
        options: toQuestionOptions(draft),
        answer,
        explainMd,
        attachmentIds: draft.attachments.map((asset) => asset.id),
      })
      replaceQuestion({ ...updated, answer, explainMd })
    })
  }

  /** Останавливает отложенные таймеры и сохраняет всё немедленно — перед
      публикацией или сменой темы не должно оставаться неотправленных правок. */
  async function flushAutosaves(): Promise<boolean> {
    clearTimers()
    const results = await Promise.all([...drafts.value.keys()].map((id) => saveQuestion(id)))
    return results.every(Boolean)
  }

  async function add(): Promise<void> {
    const quiz = loaded.value
    if (!quiz) return
    busy.value = 'new'
    error.value = null
    const draft: QuestionDraft = {
      position: quiz.questions.length,
      promptMd: 'Новый вопрос',
      type: 'single',
      options: ['Вариант 1', 'Вариант 2'],
      answer: { value: 'Вариант 1' },
    }
    try {
      const created = await createQuestion(quiz.id, draft)
      const authored: QuizQuestionAuthor = { ...created, answer: draft.answer, explainMd: null }
      loaded.value = { ...quiz, questions: [...quiz.questions, authored] }
      drafts.value = new Map(drafts.value).set(authored.id, toEditableQuestion(authored))
    } catch (cause) {
      error.value = cause
    } finally {
      busy.value = null
    }
  }

  async function attachFile(questionId: string, file: File): Promise<void> {
    const mime = assetMimeSchema.safeParse(file.type)
    if (!mime.success) {
      error.value = new Error('Можно прикреплять изображения и PDF')
      return
    }
    busy.value = `attachment-${questionId}`
    error.value = null
    try {
      const asset = await uploadAsset(file, mime.data)
      const draft = draftOf(questionId)
      if (draft && !draft.attachments.some((item) => item.id === asset.id)) {
        patch(questionId, { attachments: [...draft.attachments, asset] })
      }
    } catch (cause) {
      error.value = cause
    } finally {
      busy.value = null
    }
  }

  function detachFile(questionId: string, assetId: string): void {
    const draft = draftOf(questionId)
    if (draft) {
      patch(questionId, {
        attachments: draft.attachments.filter((asset) => asset.id !== assetId),
      })
    }
  }

  async function remove(questionId: string): Promise<void> {
    const quiz = loaded.value
    clearTimeout(saveTimers.get(questionId))
    saveTimers.delete(questionId)
    busy.value = questionId
    try {
      await deleteQuestion(questionId)
      if (quiz) {
        loaded.value = {
          ...quiz,
          questions: quiz.questions.filter((item) => item.id !== questionId),
        }
      }
      const next = new Map(drafts.value)
      next.delete(questionId)
      drafts.value = next
    } catch (cause) {
      error.value = cause
    } finally {
      busy.value = null
    }
  }

  async function togglePublished(): Promise<void> {
    const quiz = loaded.value
    if (!quiz) return
    if (!(await flushAutosaves())) return
    busy.value = 'quiz'
    try {
      const updated = await updateQuiz(quiz.id, {
        status: quiz.status === 'published' ? 'draft' : 'published',
      })
      loaded.value = { ...quiz, status: updated.status }
    } catch (cause) {
      error.value = cause
    } finally {
      busy.value = null
    }
  }

  /** Черновик считается несохранённым, пока отличается от последней подтверждённой версии вопроса. */
  const dirty = computed(() =>
    (loaded.value?.questions ?? []).some((question) => isDirty(question.id)),
  )
  useUnsavedChangesGuard(dirty, 'Есть несохранённые изменения теста. Уйти со страницы?')

  onMounted(() => void load())
  onUnmounted(() => {
    clearTimers()
  })
  watch(
    () => toValue(quizId),
    () => void load(),
  )

  const module = ref<ModuleTree | null>(null)

  const lessonOptions = computed(() => {
    const lessons =
      module.value?.items.flatMap((item) => (item.kind === 'lesson' ? [item.lesson] : [])) ?? []
    return [
      { value: MODULE_WIDE, label: 'по всему модулю' },
      ...lessons.map((lesson) => ({ value: lesson.id, label: `по уроку «${lesson.title}»` })),
    ]
  })

  const boundLesson = computed(() => loaded.value?.lessonId ?? MODULE_WIDE)

  async function bindTo(value: string): Promise<void> {
    const quiz = loaded.value
    if (!quiz) {
      return
    }
    busy.value = 'quiz'
    error.value = null
    try {
      const updated = await updateQuiz(quiz.id, { lessonId: value === MODULE_WIDE ? null : value })
      loaded.value = { ...quiz, lessonId: updated.lessonId }
    } catch (cause) {
      error.value = cause
    } finally {
      busy.value = null
    }
  }

  return {
    loaded,
    lessonOptions,
    boundLesson,
    bindTo,
    pending,
    error,
    busy,
    dirty,
    isDirty,
    isSaving,
    draftOf,
    patch,
    toggleCorrect,
    setOption,
    addOption,
    removeOption,
    attachFile,
    detachFile,
    add,
    remove,
    togglePublished,
  }
}

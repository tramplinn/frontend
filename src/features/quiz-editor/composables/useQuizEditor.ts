import { computed, onMounted, onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { getDraftModule, getDraftQuiz, updateQuiz } from '@/api/authoring'
import type { ModuleTree, QuizAuthor } from '@/api/schemas/content'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useQuestionDrafts } from '@/features/quiz-editor/composables/useQuestionDrafts'

const MODULE_WIDE = 'module'

export function useQuizEditor(quizId: MaybeRefOrGetter<string>) {
  const loaded = ref<QuizAuthor | null>(null)
  const module = ref<ModuleTree | null>(null)
  const pending = ref(true)
  const error = ref<unknown>(null)
  const busy = ref<string | null>(null)
  let loadVersion = 0

  const questions = useQuestionDrafts(loaded, busy, error)

  async function load(): Promise<void> {
    questions.clearTimers()
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
      questions.sync(quiz)
      module.value = loadedModule
    } catch (cause) {
      if (version !== loadVersion) return
      error.value = cause
    } finally {
      if (version === loadVersion) pending.value = false
    }
  }

  async function togglePublished(): Promise<void> {
    const quiz = loaded.value
    if (!quiz) return
    error.value = null
    const flushed = await questions.flushAutosaves()
    if (!flushed) {
      // flushAutosaves сам пишет в error.value настоящую причину сбоя PATCH;
      // пусто здесь — значит какой-то вопрос просто ещё не заполнен до конца.
      if (!error.value) error.value = new Error('Не все вопросы сохранены — заполните их до конца')
      return
    }
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

  useUnsavedChangesGuard(questions.dirty, 'Есть несохранённые изменения теста. Уйти со страницы?')

  onMounted(() => void load())
  onUnmounted(() => {
    questions.clearTimers()
  })
  watch(
    () => toValue(quizId),
    () => void load(),
  )

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
    dirty: questions.dirty,
    isDirty: questions.isDirty,
    isSaving: questions.isSaving,
    draftOf: questions.draftOf,
    patch: questions.patch,
    toggleCorrect: questions.toggleCorrect,
    setOption: questions.setOption,
    addOption: questions.addOption,
    removeOption: questions.removeOption,
    attachFile: questions.attachFile,
    detachFile: questions.detachFile,
    add: questions.add,
    remove: questions.remove,
    togglePublished,
  }
}

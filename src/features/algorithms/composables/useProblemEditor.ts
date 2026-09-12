import { computed, onMounted, onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { getProblem, updateProblem, validateTemplate } from '@/api/algorithmAuthoring'
import type { AlgorithmLanguage, ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { errorText } from '@/lib/errors'
import { ALL_LANGUAGES, INCOMPLETE_FIELDS_MESSAGE } from './problemEditorShared'
import type { ProblemFields, SaveCoordinator, TestCaseFields } from './problemEditorShared'
import { useProblemFieldsDraft } from './useProblemFieldsDraft'
import { useTemplateDrafts } from './useTemplateDrafts'
import { useTestCaseDrafts } from './useTestCaseDrafts'

export { ALL_LANGUAGES }
export type { ProblemFields, TestCaseFields }

export function useProblemEditor(problemId: MaybeRefOrGetter<string>) {
  const loaded = ref<ProblemAuthor | null>(null)
  const editedLanguage = ref<AlgorithmLanguage>('python')

  const pending = ref(true)
  const error = ref<unknown>(null)
  const actionError = ref<string | null>(null)
  const busy = ref<string | null>(null)
  const autosaveCount = ref(0)
  const savedAt = ref<Date | null>(null)

  let version = 0
  let saveQueue: Promise<void> = Promise.resolve()

  const autosaving = computed(() => autosaveCount.value > 0)

  async function run(key: string, action: () => Promise<void>): Promise<void> {
    busy.value = key
    actionError.value = null
    try {
      await action()
    } catch (cause) {
      actionError.value = errorText(cause)
    } finally {
      busy.value = null
    }
  }

  function enqueueSave(action: () => Promise<void>): Promise<boolean> {
    let succeeded = false
    const task = saveQueue.then(async () => {
      autosaveCount.value += 1
      actionError.value = null
      try {
        await action()
        savedAt.value = new Date()
        succeeded = true
      } catch (cause) {
        actionError.value = errorText(cause)
      } finally {
        autosaveCount.value -= 1
      }
    })
    saveQueue = task
    return task.then(() => succeeded)
  }

  async function flushQueue(): Promise<void> {
    await saveQueue
  }

  const coordinator: SaveCoordinator = { run, enqueueSave, flushQueue }

  const problemFields = useProblemFieldsDraft(loaded, coordinator)
  const testCases = useTestCaseDrafts(loaded, coordinator, () => {
    templates.invalidateTemplates()
  })
  const templates = useTemplateDrafts(loaded, coordinator)

  const dirty = computed(() => {
    if (!loaded.value) return false
    return problemFields.dirty.value || testCases.anyDirty.value || templates.anyDirty.value
  })

  const hasEmptyStatement = computed(() => !loaded.value?.statementMd.trim())
  const hasNoSample = computed(() => testCases.sampleCount.value === 0)
  const hasNoHidden = computed(() => testCases.hiddenCount.value === 0)

  const publishBlockers = computed(() => {
    if (!loaded.value) return []
    const blockers: string[] = []
    if (hasEmptyStatement.value) blockers.push('пустое условие')
    if (hasNoSample.value) blockers.push('нет ни одного примера для условия')
    if (hasNoHidden.value) blockers.push('нет ни одного скрытого теста')
    if (templates.hasNoValidatedTemplate.value)
      blockers.push('ни одно эталонное решение не проверено')
    return blockers
  })

  function clearTimers(): void {
    problemFields.cancelSave()
    testCases.clearTimers()
    templates.clearTimers()
  }

  async function load(): Promise<void> {
    clearTimers()
    const current = ++version
    pending.value = true
    error.value = null
    try {
      const problem = await getProblem(toValue(problemId))
      if (current !== version) return
      loaded.value = problem
      problemFields.sync(problem)
      testCases.sync(problem)
      templates.sync(problem)
    } catch (cause) {
      if (current === version) error.value = cause
    } finally {
      if (current === version) pending.value = false
    }
  }

  async function flushAutosaves(): Promise<boolean> {
    clearTimers()
    const results = [await problemFields.save()]
    for (const item of loaded.value?.testCases ?? [])
      results.push(await testCases.saveCase(item.id))
    for (const item of ALL_LANGUAGES) results.push(await templates.saveTemplate(item))
    await flushQueue()
    return results.every(Boolean)
  }

  async function togglePublished(): Promise<void> {
    actionError.value = null
    const flushed = await flushAutosaves()
    if (!flushed) {
      if (!(actionError.value as string | null)) actionError.value = INCOMPLETE_FIELDS_MESSAGE
      return
    }
    const problem = loaded.value
    if (!problem) return
    const next = problem.status === 'published' ? 'draft' : 'published'
    await run('publish', async () => {
      loaded.value = await updateProblem(problem.id, { status: next })
    })
  }

  /** Прогоняет solutionCode по всем тестам: без этого задачу нельзя опубликовать. */
  async function checkTemplate(language: AlgorithmLanguage): Promise<void> {
    actionError.value = null
    const flushed = await flushAutosaves()
    if (!flushed) {
      if (!(actionError.value as string | null)) actionError.value = INCOMPLETE_FIELDS_MESSAGE
      return
    }
    const problem = loaded.value
    if (!problem) return
    await run(`template:${language}`, async () => {
      templates.upsertTemplate(await validateTemplate(problem.id, language))
    })
  }

  useUnsavedChangesGuard(dirty, 'Есть несохранённые изменения задачи. Уйти со страницы?')

  watch(
    () => toValue(problemId),
    () => void load(),
  )
  onMounted(() => {
    void load()
  })
  onUnmounted(() => {
    clearTimers()
  })

  return {
    actionError,
    addCase: testCases.addCase,
    applyAssistantCases: testCases.applyAssistantCases,
    applyAssistantTemplates: templates.applyAssistantTemplates,
    assetError: problemFields.assetInsert.error,
    autosaving,
    busy,
    caseDrafts: testCases.caseDrafts,
    checkTemplate,
    dragging: problemFields.assetInsert.dragging,
    dirty,
    editedLanguage,
    error,
    fields: problemFields.fields,
    hasEmptyStatement,
    hasNoHidden,
    hasNoSample,
    hasNoValidatedTemplate: templates.hasNoValidatedTemplate,
    loaded,
    onDragLeave: problemFields.assetInsert.onDragLeave,
    onDragOver: problemFields.assetInsert.onDragOver,
    onDrop: problemFields.assetInsert.onDrop,
    onPaste: problemFields.assetInsert.onPaste,
    patchCase: testCases.patchCase,
    patchTemplate: templates.patchTemplate,
    pending,
    publishBlockers,
    removeCase: testCases.removeCase,
    removeTemplate: templates.removeTemplate,
    saveCase: testCases.saveCase,
    saveProblem: problemFields.save,
    saveTemplate: templates.saveTemplate,
    savedAt,
    setStatementField: problemFields.setStatementField,
    templateDrafts: templates.templateDrafts,
    templateOf: templates.templateOf,
    togglePublished,
    uploadingAsset: problemFields.assetInsert.uploading,
    usedLanguages: templates.usedLanguages,
  }
}

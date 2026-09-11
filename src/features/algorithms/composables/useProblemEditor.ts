import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  toValue,
  watch,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
} from 'vue'

import {
  addTestCase,
  deleteTemplate,
  deleteTestCase,
  getProblem,
  putTemplate,
  updateProblem,
  updateTestCase,
  validateTemplate,
} from '@/api/algorithmAuthoring'
import type {
  AlgorithmLanguage,
  ProblemAuthor,
  TemplateAuthor,
  TestCase,
} from '@/api/schemas/algorithmAuthoring'
import { algorithmLanguageSchema } from '@/api/schemas/algorithmAuthoring'
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import { useAssetInsert } from '@/composables/useAssetInsert'
import { useCursorInsert } from '@/composables/useCursorInsert'
import { useDebounce } from '@/composables/useDebounce'
import { errorText } from '@/lib/errors'

export interface ProblemFields {
  title: string
  statementMd: string
  difficulty: AlgorithmDifficulty
  tags: string[]
  timeLimitMs: number
  memoryLimitKb: number
}

export interface TestCaseFields {
  input: string
  expectedOutput: string
  isSample: boolean
  weight: number
}

export const ALL_LANGUAGES = algorithmLanguageSchema.options
const AUTOSAVE_DEBOUNCE_MS = 700

function toFields(problem: ProblemAuthor): ProblemFields {
  return {
    title: problem.title,
    statementMd: problem.statementMd,
    difficulty: problem.difficulty,
    tags: problem.tags.map((tag) => tag.name),
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
  }
}

function toCaseFields(item: TestCase): TestCaseFields {
  return {
    input: item.input,
    expectedOutput: item.expectedOutput,
    isSample: item.isSample,
    weight: item.weight,
  }
}

function equalItems(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

export function useProblemEditor(problemId: MaybeRefOrGetter<string>) {
  const loaded = ref<ProblemAuthor | null>(null)
  const fields = ref<ProblemFields | null>(null)
  const caseDrafts = ref(new Map<string, TestCaseFields>())
  const templateDrafts = ref(new Map<string, { starterCode: string; solutionCode: string }>())
  const editedLanguage = ref<AlgorithmLanguage>('python')
  const statementField = ref<HTMLTextAreaElement | null>(null)

  const pending = ref(true)
  const error = ref<unknown>(null)
  const actionError = ref<string | null>(null)
  const busy = ref<string | null>(null)
  const autosaveCount = ref(0)
  const savedAt = ref<Date | null>(null)

  let version = 0
  let syncing = false
  const problemSaveDebounce = useDebounce(AUTOSAVE_DEBOUNCE_MS)
  const caseTimers = new Map<string, ReturnType<typeof setTimeout>>()
  const templateTimers = new Map<AlgorithmLanguage, ReturnType<typeof setTimeout>>()
  let saveQueue: Promise<void> = Promise.resolve()

  const autosaving = computed(() => autosaveCount.value > 0)

  const usedLanguages = computed(
    () => new Set(loaded.value?.templates.map((item) => item.language) ?? []),
  )

  const sampleCount = computed(
    () => loaded.value?.testCases.filter((item) => item.isSample).length ?? 0,
  )
  const hiddenCount = computed(
    () => loaded.value?.testCases.filter((item) => !item.isSample).length ?? 0,
  )

  const problemDirty = computed(() => {
    const problem = loaded.value
    const draft = fields.value
    if (!problem || !draft) return false
    return (
      draft.title !== problem.title ||
      draft.statementMd !== problem.statementMd ||
      draft.difficulty !== problem.difficulty ||
      !equalItems(
        draft.tags,
        problem.tags.map((tag) => tag.name),
      ) ||
      draft.timeLimitMs !== problem.timeLimitMs ||
      draft.memoryLimitKb !== problem.memoryLimitKb
    )
  })

  function caseDirty(caseId: string): boolean {
    const problem = loaded.value
    const saved = problem?.testCases.find((item) => item.id === caseId)
    const draft = caseDrafts.value.get(caseId)
    return Boolean(
      saved &&
      draft &&
      (draft.input !== saved.input ||
        draft.expectedOutput !== saved.expectedOutput ||
        draft.isSample !== saved.isSample ||
        draft.weight !== saved.weight),
    )
  }

  function templateDirty(language: AlgorithmLanguage): boolean {
    const draft = templateDrafts.value.get(language)
    if (!draft) return false
    const saved = loaded.value?.templates.find((item) => item.language === language)
    return (
      draft.starterCode !== (saved?.starterCode ?? '') ||
      draft.solutionCode !== (saved?.solutionCode ?? '')
    )
  }

  const dirty = computed(() => {
    const problem = loaded.value
    if (!problem) return false
    return (
      problemDirty.value ||
      problem.testCases.some((item) => caseDirty(item.id)) ||
      ALL_LANGUAGES.some((language) => templateDirty(language))
    )
  })

  const hasEmptyStatement = computed(() => !loaded.value?.statementMd.trim())
  const hasNoSample = computed(() => sampleCount.value === 0)
  const hasNoHidden = computed(() => hiddenCount.value === 0)
  const hasNoValidatedTemplate = computed(
    () => !(loaded.value?.templates.some((item) => item.validatedAt !== null) ?? false),
  )

  const publishBlockers = computed(() => {
    if (!loaded.value) return []
    const blockers: string[] = []
    if (hasEmptyStatement.value) blockers.push('пустое условие')
    if (hasNoSample.value) blockers.push('нет ни одного примера для условия')
    if (hasNoHidden.value) blockers.push('нет ни одного скрытого теста')
    if (hasNoValidatedTemplate.value) blockers.push('ни одно эталонное решение не проверено')
    return blockers
  })

  function setStatementField(element: Element | ComponentPublicInstance | null): void {
    statementField.value = element instanceof HTMLTextAreaElement ? element : null
  }

  const { insertAtCursor, replacePlaceholder } = useCursorInsert(
    statementField,
    () => fields.value?.statementMd ?? null,
    (value) => {
      if (fields.value) fields.value.statementMd = value
    },
  )

  const assetInsert = useAssetInsert(insertAtCursor, replacePlaceholder)

  function syncDrafts(problem: ProblemAuthor): void {
    syncing = true
    loaded.value = problem
    fields.value = toFields(problem)
    caseDrafts.value = new Map(problem.testCases.map((item) => [item.id, toCaseFields(item)]))
    templateDrafts.value = new Map(
      problem.templates.map((item) => [
        item.language,
        { starterCode: item.starterCode, solutionCode: item.solutionCode },
      ]),
    )
    syncing = false
  }

  function clearTimers(): void {
    problemSaveDebounce.cancel()
    for (const timer of caseTimers.values()) clearTimeout(timer)
    for (const timer of templateTimers.values()) clearTimeout(timer)
    caseTimers.clear()
    templateTimers.clear()
  }

  async function load(): Promise<void> {
    clearTimers()
    const current = ++version
    pending.value = true
    error.value = null
    try {
      const problem = await getProblem(toValue(problemId))
      if (current !== version) return
      syncDrafts(problem)
    } catch (cause) {
      if (current === version) error.value = cause
    } finally {
      if (current === version) pending.value = false
    }
  }

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

  async function saveProblem(): Promise<boolean> {
    if (!problemDirty.value) return true
    return enqueueSave(async () => {
      const draft = fields.value
      const problem = loaded.value
      if (!draft || !problem || !problemDirty.value) return
      const submitted = { ...draft }
      const saved = await updateProblem(problem.id, {
        title: submitted.title,
        statementMd: submitted.statementMd,
        difficulty: submitted.difficulty,
        tags: submitted.tags,
        timeLimitMs: submitted.timeLimitMs,
        memoryLimitKb: submitted.memoryLimitKb,
      })
      const current = loaded.value
      if (!current || current.id !== saved.id) return
      current.title = saved.title
      current.statementMd = saved.statementMd
      current.statementHtml = saved.statementHtml
      current.difficulty = saved.difficulty
      current.tags = saved.tags
      current.timeLimitMs = saved.timeLimitMs
      current.memoryLimitKb = saved.memoryLimitKb
    })
  }

  function scheduleProblemSave(): void {
    problemSaveDebounce.schedule(() => void saveProblem())
  }

  async function togglePublished(): Promise<void> {
    if (!(await flushAutosaves())) return
    const problem = loaded.value
    if (!problem) return
    const next = problem.status === 'published' ? 'draft' : 'published'
    await run('publish', async () => {
      loaded.value = await updateProblem(problem.id, { status: next })
    })
  }

  function patchCase(caseId: string, changes: Partial<TestCaseFields>): void {
    const current = caseDrafts.value.get(caseId)
    if (current) {
      caseDrafts.value = new Map(caseDrafts.value).set(caseId, { ...current, ...changes })
      clearTimeout(caseTimers.get(caseId))
      caseTimers.set(
        caseId,
        setTimeout(() => {
          caseTimers.delete(caseId)
          void saveCase(caseId)
        }, AUTOSAVE_DEBOUNCE_MS),
      )
    }
  }

  async function addCase(): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    const position = problem.testCases.length
    await run('new-case', async () => {
      const created = await addTestCase(problem.id, {
        position,
        input: '',
        expectedOutput: '',
        isSample: false,
      })
      problem.testCases.push(created)
      caseDrafts.value = new Map(caseDrafts.value).set(created.id, toCaseFields(created))
      invalidateTemplates()
    })
  }

  /** Полностью заменяет тесты предложенными ассистентом — старые не сопоставляются
      с новыми построчно, поэтому это удаление всех и добавление заново, а не патч. */
  async function applyAssistantCases(cases: TestCaseFields[]): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await saveQueue
    await run('assistant-cases', async () => {
      for (const item of [...problem.testCases]) {
        clearTimeout(caseTimers.get(item.id))
        caseTimers.delete(item.id)
        await deleteTestCase(item.id)
      }
      problem.testCases = []
      caseDrafts.value = new Map()
      for (const [index, item] of cases.entries()) {
        const created = await addTestCase(problem.id, {
          position: index,
          input: item.input,
          expectedOutput: item.expectedOutput,
          isSample: item.isSample,
        })
        problem.testCases.push(created)
        caseDrafts.value = new Map(caseDrafts.value).set(created.id, toCaseFields(created))
      }
      invalidateTemplates()
    })
  }

  async function saveCase(caseId: string): Promise<boolean> {
    if (!caseDirty(caseId)) return true
    return enqueueSave(async () => {
      const draft = caseDrafts.value.get(caseId)
      if (!draft || !caseDirty(caseId)) return
      const saved = await updateTestCase(caseId, { ...draft })
      const problem = loaded.value
      if (!problem) return
      const index = problem.testCases.findIndex((item) => item.id === caseId)
      if (index !== -1) problem.testCases.splice(index, 1, saved)
      invalidateTemplates()
    })
  }

  async function removeCase(caseId: string): Promise<void> {
    clearTimeout(caseTimers.get(caseId))
    caseTimers.delete(caseId)
    await saveQueue
    await run(`case:${caseId}`, async () => {
      await deleteTestCase(caseId)
      const problem = loaded.value
      if (!problem) return
      problem.testCases = problem.testCases.filter((item) => item.id !== caseId)
      const nextDrafts = new Map(caseDrafts.value)
      nextDrafts.delete(caseId)
      caseDrafts.value = nextDrafts
      invalidateTemplates()
    })
  }

  function patchTemplate(
    language: AlgorithmLanguage,
    changes: Partial<{ starterCode: string; solutionCode: string }>,
  ): void {
    const current = templateDrafts.value.get(language) ?? { starterCode: '', solutionCode: '' }
    templateDrafts.value = new Map(templateDrafts.value).set(language, { ...current, ...changes })
    clearTimeout(templateTimers.get(language))
    templateTimers.set(
      language,
      setTimeout(() => {
        templateTimers.delete(language)
        void saveTemplate(language)
      }, AUTOSAVE_DEBOUNCE_MS),
    )
  }

  async function saveTemplate(language: AlgorithmLanguage): Promise<boolean> {
    if (!templateDirty(language)) return true
    return enqueueSave(async () => {
      const problem = loaded.value
      const draft = templateDrafts.value.get(language)
      if (!problem || !draft || !templateDirty(language)) return
      const saved = await putTemplate(problem.id, language, draft.starterCode, draft.solutionCode)
      upsertTemplate(saved)
    })
  }

  /** Апсерт по перечисленным языкам — шаблоны для остальных языков не трогает. */
  async function applyAssistantTemplates(
    templates: { language: AlgorithmLanguage; starterCode: string; solutionCode: string }[],
  ): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await saveQueue
    await run('assistant-templates', async () => {
      for (const item of templates) {
        clearTimeout(templateTimers.get(item.language))
        templateTimers.delete(item.language)
        const saved = await putTemplate(
          problem.id,
          item.language,
          item.starterCode,
          item.solutionCode,
        )
        upsertTemplate(saved)
        templateDrafts.value = new Map(templateDrafts.value).set(item.language, {
          starterCode: saved.starterCode,
          solutionCode: saved.solutionCode,
        })
      }
    })
  }

  async function flushAutosaves(): Promise<boolean> {
    clearTimers()
    const results = [await saveProblem()]
    for (const item of loaded.value?.testCases ?? []) results.push(await saveCase(item.id))
    for (const item of ALL_LANGUAGES) results.push(await saveTemplate(item))
    await saveQueue
    return results.every(Boolean)
  }

  /** Прогоняет solutionCode по всем тестам: без этого задачу нельзя опубликовать. */
  async function checkTemplate(language: AlgorithmLanguage): Promise<void> {
    if (!(await flushAutosaves())) return
    const problem = loaded.value
    if (!problem) return
    await run(`template:${language}`, async () => {
      upsertTemplate(await validateTemplate(problem.id, language))
    })
  }

  async function removeTemplate(language: AlgorithmLanguage): Promise<void> {
    clearTimeout(templateTimers.get(language))
    templateTimers.delete(language)
    await saveQueue
    const problem = loaded.value
    if (!problem) return
    await run(`template:${language}`, async () => {
      await deleteTemplate(problem.id, language)
      problem.templates = problem.templates.filter((item) => item.language !== language)
      const nextDrafts = new Map(templateDrafts.value)
      nextDrafts.delete(language)
      templateDrafts.value = nextDrafts
    })
  }

  function upsertTemplate(template: TemplateAuthor): void {
    const problem = loaded.value
    if (!problem) return
    const index = problem.templates.findIndex((item) => item.language === template.language)
    if (index === -1) problem.templates.push(template)
    else problem.templates.splice(index, 1, template)
  }

  function invalidateTemplates(): void {
    const problem = loaded.value
    if (!problem) return
    problem.templates = problem.templates.map((item) => ({ ...item, validatedAt: null }))
  }

  function templateOf(language: string): TemplateAuthor | undefined {
    return loaded.value?.templates.find((item) => item.language === language)
  }

  function guard(event: BeforeUnloadEvent): void {
    if (dirty.value) event.preventDefault()
  }

  watch(
    () => toValue(problemId),
    () => void load(),
  )
  watch(
    fields,
    () => {
      if (!syncing) scheduleProblemSave()
    },
    { deep: true, flush: 'sync' },
  )
  onMounted(() => {
    void load()
    window.addEventListener('beforeunload', guard)
  })
  onUnmounted(() => {
    clearTimers()
    window.removeEventListener('beforeunload', guard)
  })

  return {
    actionError,
    addCase,
    applyAssistantCases,
    applyAssistantTemplates,
    assetError: assetInsert.error,
    autosaving,
    busy,
    caseDrafts,
    checkTemplate,
    dragging: assetInsert.dragging,
    dirty,
    editedLanguage,
    error,
    fields,
    hasEmptyStatement,
    hasNoHidden,
    hasNoSample,
    hasNoValidatedTemplate,
    loaded,
    onDragLeave: assetInsert.onDragLeave,
    onDragOver: assetInsert.onDragOver,
    onDrop: assetInsert.onDrop,
    onPaste: assetInsert.onPaste,
    patchCase,
    patchTemplate,
    pending,
    publishBlockers,
    removeCase,
    removeTemplate,
    saveCase,
    saveProblem,
    saveTemplate,
    savedAt,
    setStatementField,
    templateDrafts,
    templateOf,
    togglePublished,
    uploadingAsset: assetInsert.uploading,
    usedLanguages,
  }
}

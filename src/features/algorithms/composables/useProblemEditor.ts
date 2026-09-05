import {
  computed,
  nextTick,
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
import { errorText } from '@/lib/errors'

export interface ProblemFields {
  title: string
  statementMd: string
  difficulty: AlgorithmDifficulty
  topics: string
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

function toFields(problem: ProblemAuthor): ProblemFields {
  return {
    title: problem.title,
    statementMd: problem.statementMd,
    difficulty: problem.difficulty,
    topics: problem.topics.join(', '),
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

function topicsOf(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
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

  let version = 0

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
      !equalItems(topicsOf(draft.topics), problem.topics) ||
      draft.timeLimitMs !== problem.timeLimitMs ||
      draft.memoryLimitKb !== problem.memoryLimitKb
    )
  })

  const dirty = computed(() => {
    const problem = loaded.value
    if (!problem) return false
    if (problemDirty.value) return true
    const changedCase = problem.testCases.some((item) => {
      const draft = caseDrafts.value.get(item.id)
      return (
        draft !== undefined &&
        (draft.input !== item.input ||
          draft.expectedOutput !== item.expectedOutput ||
          draft.isSample !== item.isSample ||
          draft.weight !== item.weight)
      )
    })
    if (changedCase) return true
    return [...templateDrafts.value].some(([language, draft]) => {
      const saved = problem.templates.find((item) => item.language === language)
      return (
        draft.starterCode !== (saved?.starterCode ?? '') ||
        draft.solutionCode !== (saved?.solutionCode ?? '')
      )
    })
  })

  /** Каждый флаг относится к своей секции формы — сообщение показывается прямо там,
      а не общим списком сверху, куда непонятно на что смотреть. */
  const hasEmptyStatement = computed(() => !loaded.value?.statementMd.trim())
  const hasNoSample = computed(() => sampleCount.value === 0)
  const hasNoHidden = computed(() => hiddenCount.value === 0)
  const hasNoValidatedTemplate = computed(
    () => !(loaded.value?.templates.some((item) => item.validatedAt !== null) ?? false),
  )

  /** Публиковать можно только задачу с тестами (пример + скрытый) и проверенным решением. */
  const publishBlockers = computed(() => {
    if (!loaded.value) return []
    const blockers: string[] = []
    if (hasEmptyStatement.value) blockers.push('пустое условие')
    if (hasNoSample.value) blockers.push('нет ни одного примера для условия')
    if (hasNoHidden.value) blockers.push('нет ни одного скрытого теста')
    if (hasNoValidatedTemplate.value) blockers.push('ни одно эталонное решение не проверено')
    return blockers
  })

  function insertAtCursor(text: string): void {
    const current = fields.value
    if (!current) return
    const field = statementField.value
    if (!field) {
      current.statementMd += text
      return
    }
    const start = field.selectionStart
    const end = field.selectionEnd
    current.statementMd =
      current.statementMd.slice(0, start) + text + current.statementMd.slice(end)
    void nextTick(() => {
      const at = start + text.length
      field.focus()
      field.setSelectionRange(at, at)
    })
  }

  function replacePlaceholder(placeholder: string, markdown: string): void {
    const current = fields.value
    if (!current) return
    current.statementMd = current.statementMd.replace(placeholder, markdown)
  }

  function setStatementField(element: Element | ComponentPublicInstance | null): void {
    statementField.value = element instanceof HTMLTextAreaElement ? element : null
  }

  const assetInsert = useAssetInsert(insertAtCursor, replacePlaceholder)

  function syncDrafts(problem: ProblemAuthor): void {
    loaded.value = problem
    fields.value = toFields(problem)
    caseDrafts.value = new Map(problem.testCases.map((item) => [item.id, toCaseFields(item)]))
    templateDrafts.value = new Map(
      problem.templates.map((item) => [
        item.language,
        { starterCode: item.starterCode, solutionCode: item.solutionCode },
      ]),
    )
  }

  async function load(): Promise<void> {
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

  async function saveProblem(): Promise<void> {
    const draft = fields.value
    const problem = loaded.value
    if (!draft || !problem) return
    await run('problem', async () => {
      const saved = await updateProblem(problem.id, {
        title: draft.title,
        statementMd: draft.statementMd,
        difficulty: draft.difficulty,
        topics: topicsOf(draft.topics),
        timeLimitMs: draft.timeLimitMs,
        memoryLimitKb: draft.memoryLimitKb,
      })
      loaded.value = saved
    })
  }

  async function togglePublished(): Promise<void> {
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

  async function saveCase(caseId: string): Promise<void> {
    const draft = caseDrafts.value.get(caseId)
    if (!draft) return
    await run(`case:${caseId}`, async () => {
      const saved = await updateTestCase(caseId, draft)
      const problem = loaded.value
      if (!problem) return
      const index = problem.testCases.findIndex((item) => item.id === caseId)
      if (index !== -1) problem.testCases.splice(index, 1, saved)
      invalidateTemplates()
    })
  }

  async function removeCase(caseId: string): Promise<void> {
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
    language: string,
    changes: Partial<{ starterCode: string; solutionCode: string }>,
  ): void {
    const current = templateDrafts.value.get(language) ?? { starterCode: '', solutionCode: '' }
    templateDrafts.value = new Map(templateDrafts.value).set(language, { ...current, ...changes })
  }

  async function saveTemplate(language: AlgorithmLanguage): Promise<void> {
    const problem = loaded.value
    const draft = templateDrafts.value.get(language) ?? { starterCode: '', solutionCode: '' }
    if (!problem) return
    await run(`template:${language}`, async () => {
      const saved = await putTemplate(problem.id, language, draft.starterCode, draft.solutionCode)
      upsertTemplate(saved)
    })
  }

  /** Прогоняет solutionCode по всем тестам: без этого задачу нельзя опубликовать. */
  async function checkTemplate(language: AlgorithmLanguage): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await run(`template:${language}`, async () => {
      upsertTemplate(await validateTemplate(problem.id, language))
    })
  }

  async function removeTemplate(language: AlgorithmLanguage): Promise<void> {
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
  onMounted(() => {
    void load()
    window.addEventListener('beforeunload', guard)
  })
  onUnmounted(() => {
    window.removeEventListener('beforeunload', guard)
  })

  return {
    actionError,
    addCase,
    assetError: assetInsert.error,
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
    setStatementField,
    templateDrafts,
    templateOf,
    togglePublished,
    uploadingAsset: assetInsert.uploading,
    usedLanguages,
  }
}

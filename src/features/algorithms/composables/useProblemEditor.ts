import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

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

export function useProblemEditor(problemId: MaybeRefOrGetter<string>) {
  const loaded = ref<ProblemAuthor | null>(null)
  const fields = ref<ProblemFields | null>(null)
  const caseDrafts = ref(new Map<string, TestCaseFields>())
  const templateDrafts = ref(new Map<string, { starterCode: string; solutionCode: string }>())
  const editedLanguage = ref<AlgorithmLanguage>('python')

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

  /** Публиковать можно только задачу с тестами и хотя бы одним проверенным решением. */
  const publishBlockers = computed(() => {
    const problem = loaded.value
    if (!problem) return []
    const blockers: string[] = []
    if (problem.testCases.length === 0) blockers.push('нет ни одного теста')
    if (sampleCount.value === 0) blockers.push('нет ни одного примера для условия')
    if (!problem.statementMd.trim()) blockers.push('пустое условие')
    if (!problem.templates.some((item) => item.validatedAt !== null)) {
      blockers.push('ни одно эталонное решение не проверено')
    }
    return blockers
  })

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

  async function run(key: string, action: () => Promise<ProblemAuthor | null>): Promise<void> {
    busy.value = key
    actionError.value = null
    try {
      const result = await action()
      if (result) syncDrafts(result)
      else await load()
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
    await run('problem', () =>
      updateProblem(problem.id, {
        title: draft.title,
        statementMd: draft.statementMd,
        difficulty: draft.difficulty,
        topics: draft.topics
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        timeLimitMs: draft.timeLimitMs,
        memoryLimitKb: draft.memoryLimitKb,
      }),
    )
  }

  async function togglePublished(): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    const next = problem.status === 'published' ? 'draft' : 'published'
    await run('publish', () => updateProblem(problem.id, { status: next }))
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
      await addTestCase(problem.id, { position, input: '', expectedOutput: '', isSample: false })
      return null
    })
  }

  async function saveCase(caseId: string): Promise<void> {
    const draft = caseDrafts.value.get(caseId)
    if (!draft) return
    await run(`case:${caseId}`, async () => {
      await updateTestCase(caseId, draft)
      return null
    })
  }

  async function removeCase(caseId: string): Promise<void> {
    await run(`case:${caseId}`, async () => {
      await deleteTestCase(caseId)
      return null
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
      await putTemplate(problem.id, language, draft.starterCode, draft.solutionCode)
      return null
    })
  }

  /** Прогоняет solutionCode по всем тестам: без этого задачу нельзя опубликовать. */
  async function checkTemplate(language: AlgorithmLanguage): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await run(`template:${language}`, async () => {
      await validateTemplate(problem.id, language)
      return null
    })
  }

  async function removeTemplate(language: AlgorithmLanguage): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await run(`template:${language}`, async () => {
      await deleteTemplate(problem.id, language)
      return null
    })
  }

  function templateOf(language: string): TemplateAuthor | undefined {
    return loaded.value?.templates.find((item) => item.language === language)
  }

  watch(
    () => toValue(problemId),
    () => void load(),
  )
  onMounted(() => void load())

  return {
    actionError,
    addCase,
    busy,
    caseDrafts,
    checkTemplate,
    editedLanguage,
    error,
    fields,
    loaded,
    patchCase,
    patchTemplate,
    pending,
    publishBlockers,
    removeCase,
    removeTemplate,
    saveCase,
    saveProblem,
    saveTemplate,
    templateDrafts,
    templateOf,
    togglePublished,
    usedLanguages,
  }
}

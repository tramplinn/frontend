import { computed, ref, watch } from 'vue'

import {
  getAlgorithmProblem,
  getAlgorithmProgress,
  getAlgorithmSubmission,
  listAlgorithmLanguages,
  listAlgorithmSolutions,
  runAlgorithm,
  saveAlgorithmReflection,
  submitAlgorithm,
} from '@/api/algorithms'
import type {
  AlgorithmProblem,
  AlgorithmProgress,
  AlgorithmSolution,
  AlgorithmSubmission,
} from '@/api/schemas/algorithms'
import { useVersionedLoad } from '@/composables/useVersionedLoad'

const POLL_DELAYS_MS = [1000, 2000, 3000] as const

let runnerLanguages: Promise<string[]> | null = null

function loadRunnerLanguages(): Promise<string[]> {
  runnerLanguages ??= listAlgorithmLanguages()
    .then((items) => items.map((item) => item.key))
    .catch(() => [])
  return runnerLanguages
}

export interface ProblemRunnerOptions {
  problemId: () => string
  sessionId: () => string | null
  active: () => boolean
}

export function useProblemRunner(options: ProblemRunnerOptions) {
  const problem = ref<AlgorithmProblem | null>(null)
  const progress = ref<AlgorithmProgress | null>(null)
  const language = ref('')
  const sourceCode = ref('')
  const customInput = ref('')
  const result = ref<AlgorithmSubmission | null>(null)
  const problemPending = ref(false)
  const running = ref(false)
  const savingReflection = ref(false)
  const runError = ref<unknown>(null)
  const supported = ref<string[]>([])
  const solutions = ref<AlgorithmSolution[]>([])

  const drafts = new Map<string, string>()
  const requestGuard = useVersionedLoad()

  /* Как на LeetCode: студент может решать на любом языке раннера, а не только
     на тех, для которых автор задачи завёл стартовый шаблон. Список шаблонов —
     это только источник стартового кода, а не ограничение выбора. */
  const languages = computed(() => {
    if (supported.value.length > 0) {
      return supported.value
    }
    return problem.value?.templates.map((item) => item.language) ?? []
  })

  const queueStatus = computed(() => {
    const current = result.value
    if (!current) return null
    if (current.status === 'queued') return 'в очереди'
    if (current.status === 'running') return 'выполняется'
    return current.verdict ?? 'ошибка выполнения'
  })

  const canExecute = computed(
    () =>
      options.active() &&
      Boolean(options.sessionId()) &&
      Boolean(problem.value && language.value && sourceCode.value.trim()) &&
      !running.value,
  )

  function draftKey(problemId: string, lang: string): string {
    return `${problemId}:${lang}`
  }

  /* Раз выбор языков больше не сводится к шаблонам задачи, по умолчанию всё
     равно предпочитаем язык, для которого автор оставил стартовый код. */
  function defaultLanguage(): string {
    const withTemplate = problem.value?.templates.map((item) => item.language) ?? []
    return withTemplate.find((item) => languages.value.includes(item)) ?? languages.value[0] ?? ''
  }

  function selectLanguage(next: string): void {
    const current = problem.value
    if (!current) return
    if (language.value && language.value !== next) {
      drafts.set(draftKey(current.id, language.value), sourceCode.value)
    }
    language.value = next
    const template = current.templates.find((item) => item.language === next)
    sourceCode.value = drafts.get(draftKey(current.id, next)) ?? template?.starterCode ?? ''
  }

  async function load(): Promise<void> {
    const id = options.problemId()
    if (!id) return
    const version = requestGuard.start()
    problemPending.value = true
    runError.value = null
    result.value = null
    solutions.value = []
    try {
      const [loaded, allowed] = await Promise.all([getAlgorithmProblem(id), loadRunnerLanguages()])
      if (!requestGuard.isCurrent(version)) return
      problem.value = loaded
      supported.value = allowed
      language.value = ''
      selectLanguage(defaultLanguage())
      const languageAtLoad = language.value
      const sourceCodeAtLoad = sourceCode.value
      getAlgorithmProgress(id)
        .then((value) => {
          if (!requestGuard.isCurrent(version)) return
          progress.value = value
          const solution = value.lastSolutionCode
          const solutionLanguage = value.lastSolutionLanguage
          const untouched =
            language.value === languageAtLoad && sourceCode.value === sourceCodeAtLoad
          if (
            untouched &&
            solution &&
            solutionLanguage &&
            languages.value.includes(solutionLanguage)
          ) {
            drafts.set(draftKey(id, solutionLanguage), solution)
            selectLanguage(solutionLanguage)
          }
        })
        .catch(() => {})
      listAlgorithmSolutions(id)
        .then((value) => {
          if (!requestGuard.isCurrent(version)) return
          solutions.value = value
        })
        .catch(() => {})
    } catch (cause) {
      if (requestGuard.isCurrent(version)) runError.value = cause
    } finally {
      if (requestGuard.isCurrent(version)) problemPending.value = false
    }
  }

  async function poll(initial: AlgorithmSubmission, version: number): Promise<void> {
    let current = initial
    result.value = current
    let attempt = 0
    while (current.status !== 'finished' && current.status !== 'failed') {
      const delay = POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)]
      attempt += 1
      await new Promise((resolve) => setTimeout(resolve, delay))
      if (!requestGuard.isCurrent(version)) return
      current = await getAlgorithmSubmission(initial.id)
      if (requestGuard.isCurrent(version)) result.value = current
    }
  }

  async function execute(kind: 'run' | 'submit'): Promise<void> {
    const currentProblem = problem.value
    const sessionId = options.sessionId()
    if (!canExecute.value || !currentProblem || !sessionId) return
    const version = requestGuard.peek()
    running.value = true
    runError.value = null
    try {
      const payload = {
        sessionId,
        language: language.value,
        sourceCode: sourceCode.value,
        customInput: customInput.value || null,
      }
      const initial =
        kind === 'run'
          ? await runAlgorithm(currentProblem.id, payload)
          : await submitAlgorithm(currentProblem.id, payload)
      if (requestGuard.isCurrent(version)) await poll(initial, version)
      if (kind === 'submit' && requestGuard.isCurrent(version)) {
        progress.value = await getAlgorithmProgress(currentProblem.id).catch(() => progress.value)
        solutions.value = await listAlgorithmSolutions(currentProblem.id).catch(
          () => solutions.value,
        )
      }
    } catch (cause) {
      if (requestGuard.isCurrent(version)) runError.value = cause
    } finally {
      if (requestGuard.isCurrent(version)) running.value = false
    }
  }

  function resetToStarter(): void {
    const current = problem.value
    if (!current) return
    const template = current.templates.find((item) => item.language === language.value)
    drafts.delete(draftKey(current.id, language.value))
    sourceCode.value = template?.starterCode ?? ''
  }

  /** Подставляет код одного из прошлых принятых решений как черновик — LeetCode-style restore. */
  function loadSolution(id: string): void {
    const current = problem.value
    const target = solutions.value.find((item) => item.id === id)
    if (!current || !target || !languages.value.includes(target.language)) return
    drafts.set(draftKey(current.id, target.language), target.sourceCode)
    selectLanguage(target.language)
  }

  async function saveReflection(draft: {
    complexityMd: string | null
    confidence: number | null
    reflectionMd: string | null
  }): Promise<void> {
    const currentProblem = problem.value
    if (!currentProblem) return
    savingReflection.value = true
    runError.value = null
    try {
      progress.value = await saveAlgorithmReflection(currentProblem.id, draft)
    } catch (cause) {
      runError.value = cause
    } finally {
      savingReflection.value = false
    }
  }

  function dispose(): void {
    requestGuard.cancel()
  }

  watch(sourceCode, (value) => {
    if (problem.value && language.value) {
      drafts.set(draftKey(problem.value.id, language.value), value)
    }
  })

  return {
    canExecute,
    customInput,
    dispose,
    execute,
    language,
    languages,
    load,
    loadSolution,
    problem,
    problemPending,
    progress,
    queueStatus,
    result,
    resetToStarter,
    runError,
    running,
    saveReflection,
    savingReflection,
    selectLanguage,
    solutions,
    sourceCode,
  }
}

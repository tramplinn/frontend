import { computed, ref, watch } from 'vue'

import {
  getAlgorithmProblem,
  getAlgorithmProgress,
  getAlgorithmSubmission,
  listAlgorithmLanguages,
  runAlgorithm,
  saveAlgorithmReflection,
  submitAlgorithm,
} from '@/api/algorithms'
import type {
  AlgorithmProblem,
  AlgorithmProgress,
  AlgorithmSubmission,
} from '@/api/schemas/algorithms'

const POLL_DELAYS_MS = [1000, 2000, 3000] as const

/** Кэш на модуль: список языков раннера один на всё приложение и почти не меняется. */
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
  /** Пока false, отправка блокируется: сессия завершена или ещё не создана. */
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

  const drafts = new Map<string, string>()
  let alive = true
  let requestId = 0

  /** Язык предлагается, только если он есть и в шаблонах задачи, и в раннере:
      иначе про отказ пользователь узнавал бы уже после отправки. */
  const languages = computed(() => {
    const templates = problem.value?.templates.map((item) => item.language) ?? []
    if (supported.value.length === 0) {
      return templates
    }
    const allowed = new Set(supported.value)
    return templates.filter((item) => allowed.has(item))
  })

  const unavailableLanguages = computed(() => {
    const offered = new Set(languages.value)
    return (problem.value?.templates.map((item) => item.language) ?? []).filter(
      (item) => !offered.has(item),
    )
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

  function selectLanguage(next: string): void {
    const current = problem.value
    if (!current) return
    /* Черновик прежнего языка сохраняем синхронно: watch отработал бы только
       на следующем тике, и при быстром переключении правки терялись бы. */
    if (language.value) {
      drafts.set(draftKey(current.id, language.value), sourceCode.value)
    }
    language.value = next
    const template = current.templates.find((item) => item.language === next)
    sourceCode.value = drafts.get(draftKey(current.id, next)) ?? template?.starterCode ?? ''
  }

  async function load(): Promise<void> {
    const id = options.problemId()
    if (!id) return
    const version = ++requestId
    problemPending.value = true
    runError.value = null
    result.value = null
    try {
      const [loaded, allowed] = await Promise.all([getAlgorithmProblem(id), loadRunnerLanguages()])
      if (!alive || version !== requestId) return
      problem.value = loaded
      supported.value = allowed
      language.value = ''
      selectLanguage(languages.value[0] ?? loaded.templates[0]?.language ?? '')
      // Прогресс не критичен для решения — его отсутствие не должно ломать экран.
      getAlgorithmProgress(id)
        .then((value) => {
          if (alive && version === requestId) progress.value = value
        })
        .catch(() => {})
    } catch (cause) {
      if (version === requestId) runError.value = cause
    } finally {
      if (version === requestId) problemPending.value = false
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
      if (!alive || version !== requestId) return
      current = await getAlgorithmSubmission(initial.id)
      if (version === requestId) result.value = current
    }
  }

  async function execute(kind: 'run' | 'submit'): Promise<void> {
    const currentProblem = problem.value
    const sessionId = options.sessionId()
    if (!canExecute.value || !currentProblem || !sessionId) return
    const version = requestId
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
      if (version === requestId) await poll(initial, version)
      if (kind === 'submit' && alive && version === requestId) {
        progress.value = await getAlgorithmProgress(currentProblem.id).catch(() => progress.value)
      }
    } catch (cause) {
      if (version === requestId) runError.value = cause
    } finally {
      if (version === requestId) running.value = false
    }
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
    alive = false
    requestId += 1
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
    problem,
    problemPending,
    progress,
    queueStatus,
    result,
    runError,
    running,
    saveReflection,
    savingReflection,
    selectLanguage,
    sourceCode,
    unavailableLanguages,
  }
}

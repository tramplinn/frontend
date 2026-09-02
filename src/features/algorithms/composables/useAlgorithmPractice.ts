import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import {
  completePracticeSession,
  getAlgorithmProblem,
  getAlgorithmSubmission,
  getPracticeSession,
  getPracticeSet,
  runAlgorithm,
  startPracticeSession,
  submitAlgorithm,
} from '@/api/algorithms'
import type {
  AlgorithmProblem,
  AlgorithmSubmission,
  PracticeSession,
  PracticeSet,
} from '@/api/schemas/algorithms'

const POLL_DELAYS_MS = [1000, 2000, 3000] as const
const CLOCK_INTERVAL_MS = 1000

function storageKey(setId: string): string {
  return `tramplin:practice-session:${setId}`
}

function readSessionId(setId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(setId))
  } catch {
    return null
  }
}

function rememberSession(setId: string, sessionId: string | null): void {
  try {
    if (sessionId) sessionStorage.setItem(storageKey(setId), sessionId)
    else sessionStorage.removeItem(storageKey(setId))
  } catch {
    // Практика продолжит работать, но сессия не восстановится после перезагрузки.
  }
}

export function useAlgorithmPractice(setId: () => string) {
  const practiceSet = ref<PracticeSet | null>(null)
  const session = ref<PracticeSession | null>(null)
  const problem = ref<AlgorithmProblem | null>(null)
  const selectedId = ref('')
  const language = ref('')
  const sourceCode = ref('')
  const customInput = ref('')
  const result = ref<AlgorithmSubmission | null>(null)
  const pending = ref(true)
  const problemPending = ref(false)
  const running = ref(false)
  const error = ref<unknown>(null)
  const runError = ref<unknown>(null)
  const now = ref(Date.now())
  const drafts = new Map<string, string>()

  let active = true
  let clock: ReturnType<typeof setInterval> | null = null
  let contextVersion = 0
  let problemRequest = 0

  const queueStatus = computed(() => {
    if (!result.value) return null
    if (result.value.status === 'queued') return 'в очереди'
    if (result.value.status === 'running') return 'выполняется'
    return result.value.verdict ?? 'ошибка выполнения'
  })

  const secondsLeft = computed(() => {
    if (!session.value?.deadlineAt) return null
    return Math.max(0, Math.ceil((new Date(session.value.deadlineAt).getTime() - now.value) / 1000))
  })

  const timerText = computed(() => {
    if (secondsLeft.value === null) return null
    const minutes = Math.floor(secondsLeft.value / 60)
    const seconds = secondsLeft.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const canExecute = computed(
    () =>
      session.value?.status === 'active' &&
      Boolean(problem.value && language.value && sourceCode.value.trim()) &&
      !running.value,
  )

  async function restoreOrStartSession(targetSetId: string): Promise<PracticeSession> {
    const stored = readSessionId(targetSetId)
    if (stored) {
      try {
        const restored = await getPracticeSession(stored)
        if (restored.status === 'active') return restored
      } catch {
        rememberSession(targetSetId, null)
      }
    }
    const created = await startPracticeSession(targetSetId)
    rememberSession(targetSetId, created.id)
    return created
  }

  async function load(): Promise<void> {
    const version = ++contextVersion
    const targetSetId = setId()
    problemRequest += 1
    pending.value = true
    error.value = null
    practiceSet.value = null
    session.value = null
    problem.value = null
    selectedId.value = ''
    result.value = null
    try {
      const [loadedSet, loadedSession] = await Promise.all([
        getPracticeSet(targetSetId),
        restoreOrStartSession(targetSetId),
      ])
      if (!active || version !== contextVersion) return
      practiceSet.value = loadedSet
      session.value = loadedSession
      selectedId.value = loadedSet.problems[0]?.problemId ?? ''
    } catch (cause) {
      if (version === contextVersion) error.value = cause
    } finally {
      if (version === contextVersion) pending.value = false
    }
  }

  async function loadProblem(id: string): Promise<void> {
    if (!id) return
    const requestId = ++problemRequest
    problemPending.value = true
    runError.value = null
    try {
      const loaded = await getAlgorithmProblem(id)
      if (!active || requestId !== problemRequest) return
      problem.value = loaded
      language.value = loaded.templates[0]?.language ?? ''
      sourceCode.value =
        drafts.get(`${id}:${language.value}`) ?? loaded.templates[0]?.starterCode ?? ''
      result.value = null
    } catch (cause) {
      if (requestId === problemRequest) runError.value = cause
    } finally {
      if (requestId === problemRequest) problemPending.value = false
    }
  }

  function changeLanguage(): void {
    if (!problem.value) return
    const template = problem.value.templates.find((item) => item.language === language.value)
    sourceCode.value =
      drafts.get(`${problem.value.id}:${language.value}`) ?? template?.starterCode ?? ''
  }

  async function poll(initial: AlgorithmSubmission, version: number): Promise<void> {
    let current = initial
    result.value = current
    let attempt = 0
    while (current.status !== 'finished' && current.status !== 'failed') {
      const delay = POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)]
      attempt += 1
      await new Promise((resolve) => setTimeout(resolve, delay))
      if (!active || version !== contextVersion) return
      current = await getAlgorithmSubmission(initial.id)
      if (version === contextVersion) result.value = current
    }
  }

  async function execute(kind: 'run' | 'submit'): Promise<void> {
    const currentProblem = problem.value
    const currentSession = session.value
    if (!canExecute.value || !currentProblem || !currentSession) return
    const version = contextVersion
    running.value = true
    runError.value = null
    drafts.set(`${currentProblem.id}:${language.value}`, sourceCode.value)
    try {
      const payload = {
        sessionId: currentSession.id,
        language: language.value,
        sourceCode: sourceCode.value,
        customInput: customInput.value || null,
      }
      const initial =
        kind === 'run'
          ? await runAlgorithm(currentProblem.id, payload)
          : await submitAlgorithm(currentProblem.id, payload)
      if (version === contextVersion) await poll(initial, version)
    } catch (cause) {
      if (version === contextVersion) runError.value = cause
    } finally {
      if (version === contextVersion) running.value = false
    }
  }

  async function finish(): Promise<void> {
    const current = session.value
    if (!current) return
    try {
      session.value = await completePracticeSession(current.id, null)
      rememberSession(setId(), null)
    } catch (cause) {
      runError.value = cause
    }
  }

  watch(setId, () => void load())
  watch(selectedId, (id) => void loadProblem(id))
  watch(sourceCode, (value) => {
    if (problem.value && language.value) drafts.set(`${problem.value.id}:${language.value}`, value)
  })

  onMounted(() => {
    clock = setInterval(() => (now.value = Date.now()), CLOCK_INTERVAL_MS)
    void load()
  })
  onUnmounted(() => {
    active = false
    contextVersion += 1
    if (clock) clearInterval(clock)
  })

  return {
    canExecute,
    changeLanguage,
    customInput,
    error,
    execute,
    finish,
    language,
    pending,
    practiceSet,
    problem,
    problemPending,
    queueStatus,
    result,
    runError,
    running,
    selectedId,
    session,
    sourceCode,
    timerText,
  }
}

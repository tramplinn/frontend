import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import {
  completePracticeSession,
  getPracticeSession,
  getPracticeSet,
  startPracticeSession,
} from '@/api/algorithms'
import type { PracticeSession, PracticeSet } from '@/api/schemas/algorithms'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import { readSessionValue, writeSessionValue } from '@/lib/sessionKeyStorage'

import { useProblemRunner } from './useProblemRunner'

const CLOCK_INTERVAL_MS = 1000

function storageKey(setId: string): string {
  return `tramplin:practice-session:${setId}`
}

function readSessionId(setId: string): string | null {
  return readSessionValue(storageKey(setId))
}

function rememberSession(setId: string, sessionId: string | null): void {
  writeSessionValue(storageKey(setId), sessionId)
}

export function useAlgorithmPractice(setId: () => string) {
  const practiceSet = ref<PracticeSet | null>(null)
  const session = ref<PracticeSession | null>(null)
  const selectedId = ref('')
  const pending = ref(true)
  const error = ref<unknown>(null)
  const finishing = ref(false)
  const now = ref(Date.now())

  const runner = useProblemRunner({
    problemId: () => selectedId.value,
    sessionId: () => session.value?.id ?? null,
    active: () => session.value?.status === 'active',
  })

  let clock: ReturnType<typeof setInterval> | null = null
  const loadGuard = useVersionedLoad()

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

  const solvedIds = computed(
    () =>
      new Set(practiceSet.value?.problems.filter((item) => item.solved).map((i) => i.problemId)),
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
    const current = loadGuard.start()
    const targetSetId = setId()
    pending.value = true
    error.value = null
    practiceSet.value = null
    session.value = null
    selectedId.value = ''
    try {
      const [loadedSet, loadedSession] = await Promise.all([
        getPracticeSet(targetSetId),
        restoreOrStartSession(targetSetId),
      ])
      if (!loadGuard.isCurrent(current)) return
      practiceSet.value = loadedSet
      session.value = loadedSession
      selectedId.value = loadedSet.problems[0]?.problemId ?? ''
    } catch (cause) {
      if (loadGuard.isCurrent(current)) error.value = cause
    } finally {
      if (loadGuard.isCurrent(current)) pending.value = false
    }
  }

  async function finish(reflectionMd: string | null): Promise<void> {
    const current = session.value
    if (!current) return
    finishing.value = true
    try {
      session.value = await completePracticeSession(current.id, reflectionMd)
      rememberSession(setId(), null)
    } catch (cause) {
      error.value = cause
    } finally {
      finishing.value = false
    }
  }

  watch(setId, () => void load())
  watch(selectedId, (id) => {
    if (id) void runner.load()
  })

  onMounted(() => {
    clock = setInterval(() => (now.value = Date.now()), CLOCK_INTERVAL_MS)
    void load()
  })

  onUnmounted(() => {
    loadGuard.cancel()
    runner.dispose()
    if (clock) clearInterval(clock)
  })

  return {
    error,
    finish,
    finishing,
    load,
    pending,
    practiceSet,
    runner,
    selectedId,
    session,
    solvedIds,
    timerText,
  }
}

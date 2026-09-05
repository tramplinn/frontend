import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { getPracticeSession, startFreeSession } from '@/api/algorithms'
import type { PracticeSession } from '@/api/schemas/algorithms'
import { readSessionValue, writeSessionValue } from '@/lib/sessionKeyStorage'

import { useProblemRunner } from './useProblemRunner'

const STORAGE_KEY = 'tramplin:free-session'

function readSessionId(): string | null {
  return readSessionValue(STORAGE_KEY)
}

function rememberSessionId(value: string | null): void {
  writeSessionValue(STORAGE_KEY, value)
}

async function restoreOrStart(): Promise<PracticeSession> {
  const stored = readSessionId()
  if (stored) {
    try {
      const restored = await getPracticeSession(stored)
      if (restored.status === 'active') return restored
    } catch {
      rememberSessionId(null)
    }
  }
  const created = await startFreeSession()
  rememberSessionId(created.id)
  return created
}

export function useAlgorithmSolo(problemId: () => string) {
  const session = ref<PracticeSession | null>(null)
  const pending = ref(true)
  const error = ref<unknown>(null)

  const runner = useProblemRunner({
    problemId,
    sessionId: () => session.value?.id ?? null,
    active: () => session.value?.status === 'active',
  })

  const solved = computed(() => runner.progress.value?.status === 'solved')

  let alive = true

  async function load(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      session.value = await restoreOrStart()
      if (!alive) return
      await runner.load()
    } catch (cause) {
      if (alive) error.value = cause
    } finally {
      if (alive) pending.value = false
    }
  }

  watch(problemId, () => void runner.load())

  onMounted(() => void load())
  onUnmounted(() => {
    alive = false
    runner.dispose()
  })

  return { error, pending, runner, session, solved }
}

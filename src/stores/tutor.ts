import { defineStore } from 'pinia'
import { ref } from 'vue'

import { safeGet, safeSet } from '@/lib/safeStorage'
import type { TutorTurn } from '@/api/tutor'

const STORAGE_KEY = 'tramplin:tutor'

type Threads = Record<string, TutorTurn[]>

function read(): Threads {
  try {
    const stored: unknown = JSON.parse(safeGet('session', STORAGE_KEY) ?? '{}')
    return stored !== null && typeof stored === 'object' ? (stored as Threads) : {}
  } catch {
    return {}
  }
}

export const useTutorStore = defineStore('tutor', () => {
  const threads = ref<Threads>(read())

  function turns(lessonId: string): TutorTurn[] {
    return threads.value[lessonId] ?? []
  }

  function setTurns(lessonId: string, next: TutorTurn[]): void {
    threads.value = { ...threads.value, [lessonId]: next }
    safeSet('session', STORAGE_KEY, JSON.stringify(threads.value))
  }

  function clear(lessonId: string): void {
    setTurns(lessonId, [])
  }

  return { turns, setTurns, clear }
})

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listLessonProgress, listQuizProgress } from '@/api/learning'
import type { QuizProgress } from '@/api/schemas/learning'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

vi.mock('@/api/learning', () => ({
  completeLesson: vi.fn(),
  getCourseProgress: vi.fn(),
  listLessonProgress: vi.fn(),
  listQuizProgress: vi.fn(),
  reopenLesson: vi.fn(),
}))

const QUIZ_ID = '01910000-0000-7000-8000-000000000010'

function quizProgress(passed: boolean): QuizProgress[] {
  return [{ quizId: QUIZ_ID, passed } as QuizProgress]
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().$patch((state) => Object.assign(state, { user: { login: 'student' } }))
  vi.mocked(listLessonProgress).mockResolvedValue([])
})

describe('progress store', () => {
  it('сданный тест отмечается пройденным без перезагрузки страницы', async () => {
    const progress = useProgressStore()
    vi.mocked(listQuizProgress).mockResolvedValueOnce(quizProgress(false))
    await progress.load()
    expect(progress.isQuizPassed(QUIZ_ID)).toBe(false)

    vi.mocked(listQuizProgress).mockResolvedValueOnce(quizProgress(true))
    await progress.reloadQuizProgress()

    expect(progress.isQuizPassed(QUIZ_ID)).toBe(true)
  })

  it('ответ после выхода из аккаунта не возвращает чужой прогресс', async () => {
    const progress = useProgressStore()
    let resolve!: (value: QuizProgress[]) => void
    vi.mocked(listQuizProgress).mockReturnValueOnce(new Promise((done) => (resolve = done)))
    const pending = progress.reloadQuizProgress()
    progress.reset()
    resolve(quizProgress(true))
    await pending

    expect(progress.isQuizPassed(QUIZ_ID)).toBe(false)
  })
})

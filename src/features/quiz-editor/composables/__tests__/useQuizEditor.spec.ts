// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { getDraftModule, getDraftQuiz, updateQuestion, updateQuiz } from '@/api/authoring'
import type { ModuleTree, QuizAuthor, QuizQuestionAuthor } from '@/api/schemas/content'

import { useQuizEditor } from '../useQuizEditor'

vi.mock('@/api/authoring', () => ({
  createQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  getDraftModule: vi.fn(),
  getDraftQuiz: vi.fn(),
  updateQuestion: vi.fn(),
  updateQuiz: vi.fn(),
}))

const question = {
  id: '01910000-0000-7000-8000-000000000011',
  promptMd: 'Что такое HTTP?',
  type: 'single',
  options: ['протокол', 'язык'],
  answer: { value: 'протокол' },
  explainMd: null,
  attachments: [],
} as unknown as QuizQuestionAuthor

const quiz = {
  id: '01910000-0000-7000-8000-000000000010',
  moduleId: '01910000-0000-7000-8000-000000000001',
  lessonId: null,
  status: 'draft',
  questions: [question],
} as unknown as QuizAuthor

function mountEditor() {
  let editor!: ReturnType<typeof useQuizEditor>
  const Host = defineComponent({
    setup() {
      editor = useQuizEditor(() => quiz.id)
    },
    render: () => null,
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
  })
  mount(Host, { global: { plugins: [router] } })
  return () => editor
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getDraftQuiz).mockResolvedValue(quiz)
  vi.mocked(getDraftModule).mockResolvedValue({ items: [] } as unknown as ModuleTree)
})

describe('useQuizEditor', () => {
  it('публикация сразу после правки не откатывает сохранённый вопрос', async () => {
    const editor = mountEditor()
    await flushPromises()

    editor().patch(question.id, { promptMd: 'Что такое HTTP? (уточнено)' })
    vi.mocked(updateQuestion).mockResolvedValue({
      ...question,
      promptMd: 'Что такое HTTP? (уточнено)',
    })
    vi.mocked(updateQuiz).mockResolvedValue({ ...quiz, status: 'published' })

    await editor().togglePublished()

    expect(editor().loaded.value?.status).toBe('published')
    expect(editor().loaded.value?.questions[0]?.promptMd).toBe('Что такое HTTP? (уточнено)')
    expect(editor().isDirty(question.id)).toBe(false)
  })
})

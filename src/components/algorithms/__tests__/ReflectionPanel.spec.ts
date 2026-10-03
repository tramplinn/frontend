// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AlgorithmProgress } from '@/api/schemas/algorithms'
import ReflectionPanel from '@/components/algorithms/ReflectionPanel.vue'
import type { useProblemRunner } from '@/features/algorithms/composables/useProblemRunner'

function saved(changes: Partial<AlgorithmProgress> = {}): AlgorithmProgress {
  return {
    complexityMd: null,
    confidence: null,
    reflectionMd: null,
    status: 'attempted',
    ...changes,
  } as AlgorithmProgress
}

function mountPanel(initial: AlgorithmProgress | null) {
  const progress = ref<AlgorithmProgress | null>(initial)
  const runner = { progress, savingReflection: ref(false) } as unknown as ReturnType<
    typeof useProblemRunner
  >
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
  })
  const wrapper = mount(ReflectionPanel, { props: { runner }, global: { plugins: [router] } })
  return { wrapper, progress }
}

describe('ReflectionPanel', () => {
  it('подтягивает сохранённый разбор', () => {
    const { wrapper } = mountPanel(saved({ reflectionMd: 'жадность' }))
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('жадность')
  })

  it('несохранённые заметки переживают обновление прогресса после отправки решения', async () => {
    const { wrapper, progress } = mountPanel(saved())
    await wrapper.get('textarea').setValue('черновик заметок')
    await wrapper.get('input').setValue('O(n log n)')

    progress.value = saved({ status: 'solved' })
    await flushPromises()

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('черновик заметок')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('O(n log n)')
  })

  it('без правок новый прогресс заменяет поля', async () => {
    const { wrapper, progress } = mountPanel(saved())
    progress.value = saved({ reflectionMd: 'с сервера' })
    await flushPromises()
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('с сервера')
  })
})

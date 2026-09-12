import { computed, ref, type Ref } from 'vue'

import { addTestCase, deleteTestCase, updateTestCase } from '@/api/algorithmAuthoring'
import type { ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import {
  AUTOSAVE_DEBOUNCE_MS,
  toCaseFields,
  type SaveCoordinator,
  type TestCaseFields,
} from './problemEditorShared'

export function useTestCaseDrafts(
  loaded: Ref<ProblemAuthor | null>,
  coordinator: SaveCoordinator,
  invalidateTemplates: () => void,
) {
  const caseDrafts = ref(new Map<string, TestCaseFields>())
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const sampleCount = computed(
    () => loaded.value?.testCases.filter((item) => item.isSample).length ?? 0,
  )
  const hiddenCount = computed(
    () => loaded.value?.testCases.filter((item) => !item.isSample).length ?? 0,
  )

  function caseDirty(caseId: string): boolean {
    const problem = loaded.value
    const saved = problem?.testCases.find((item) => item.id === caseId)
    const draft = caseDrafts.value.get(caseId)
    return Boolean(
      saved &&
      draft &&
      (draft.input !== saved.input ||
        draft.expectedOutput !== saved.expectedOutput ||
        draft.isSample !== saved.isSample ||
        draft.weight !== saved.weight),
    )
  }

  const anyDirty = computed(
    () => loaded.value?.testCases.some((item) => caseDirty(item.id)) ?? false,
  )

  function sync(problem: ProblemAuthor): void {
    caseDrafts.value = new Map(problem.testCases.map((item) => [item.id, toCaseFields(item)]))
  }

  function clearTimers(): void {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  function patchCase(caseId: string, changes: Partial<TestCaseFields>): void {
    const current = caseDrafts.value.get(caseId)
    if (current) {
      caseDrafts.value = new Map(caseDrafts.value).set(caseId, { ...current, ...changes })
      clearTimeout(timers.get(caseId))
      timers.set(
        caseId,
        setTimeout(() => {
          timers.delete(caseId)
          void saveCase(caseId)
        }, AUTOSAVE_DEBOUNCE_MS),
      )
    }
  }

  async function addCase(): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    const position = problem.testCases.length
    await coordinator.run('new-case', async () => {
      const created = await addTestCase(problem.id, {
        position,
        input: '',
        expectedOutput: '',
        isSample: false,
      })
      problem.testCases.push(created)
      caseDrafts.value = new Map(caseDrafts.value).set(created.id, toCaseFields(created))
      invalidateTemplates()
    })
  }

  /** Полностью заменяет тесты предложенными ассистентом — старые не сопоставляются
      с новыми построчно, поэтому это удаление всех и добавление заново, а не патч. */
  async function applyAssistantCases(
    cases: Pick<TestCaseFields, 'input' | 'expectedOutput' | 'isSample'>[],
  ): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await coordinator.flushQueue()
    await coordinator.run('assistant-cases', async () => {
      for (const item of [...problem.testCases]) {
        clearTimeout(timers.get(item.id))
        timers.delete(item.id)
        await deleteTestCase(item.id)
      }
      problem.testCases = []
      caseDrafts.value = new Map()
      for (const [index, item] of cases.entries()) {
        const created = await addTestCase(problem.id, {
          position: index,
          input: item.input,
          expectedOutput: item.expectedOutput,
          isSample: item.isSample,
        })
        problem.testCases.push(created)
        caseDrafts.value = new Map(caseDrafts.value).set(created.id, toCaseFields(created))
      }
      invalidateTemplates()
    })
  }

  async function saveCase(caseId: string): Promise<boolean> {
    if (!caseDirty(caseId)) return true
    return coordinator.enqueueSave(async () => {
      const draft = caseDrafts.value.get(caseId)
      if (!draft || !caseDirty(caseId)) return
      const saved = await updateTestCase(caseId, { ...draft })
      const problem = loaded.value
      if (!problem) return
      const index = problem.testCases.findIndex((item) => item.id === caseId)
      if (index !== -1) problem.testCases.splice(index, 1, saved)
      invalidateTemplates()
    })
  }

  async function removeCase(caseId: string): Promise<void> {
    clearTimeout(timers.get(caseId))
    timers.delete(caseId)
    await coordinator.flushQueue()
    await coordinator.run(`case:${caseId}`, async () => {
      await deleteTestCase(caseId)
      const problem = loaded.value
      if (!problem) return
      problem.testCases = problem.testCases.filter((item) => item.id !== caseId)
      const nextDrafts = new Map(caseDrafts.value)
      nextDrafts.delete(caseId)
      caseDrafts.value = nextDrafts
      invalidateTemplates()
    })
  }

  return {
    caseDrafts,
    sampleCount,
    hiddenCount,
    anyDirty,
    caseDirty,
    sync,
    clearTimers,
    patchCase,
    addCase,
    applyAssistantCases,
    saveCase,
    removeCase,
  }
}

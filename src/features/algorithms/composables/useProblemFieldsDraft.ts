import { computed, ref, watch, type ComponentPublicInstance, type Ref } from 'vue'

import { updateProblem } from '@/api/algorithmAuthoring'
import type { ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import { useAssetInsert } from '@/composables/useAssetInsert'
import { useCursorInsert } from '@/composables/useCursorInsert'
import { useDebounce } from '@/composables/useDebounce'
import {
  AUTOSAVE_DEBOUNCE_MS,
  equalItems,
  hasValidFields,
  toFields,
  type ProblemFields,
  type SaveCoordinator,
} from './problemEditorShared'

export function useProblemFieldsDraft(
  loaded: Ref<ProblemAuthor | null>,
  coordinator: SaveCoordinator,
) {
  const fields = ref<ProblemFields | null>(null)
  const statementField = ref<HTMLTextAreaElement | null>(null)
  const debounce = useDebounce(AUTOSAVE_DEBOUNCE_MS)
  let syncing = false

  const dirty = computed(() => {
    const problem = loaded.value
    const draft = fields.value
    if (!problem || !draft) return false
    return (
      draft.title !== problem.title ||
      draft.statementMd !== problem.statementMd ||
      draft.difficulty !== problem.difficulty ||
      !equalItems(
        draft.tags,
        problem.tags.map((tag) => tag.name),
      ) ||
      draft.timeLimitMs !== problem.timeLimitMs ||
      draft.memoryLimitKb !== problem.memoryLimitKb
    )
  })

  function setStatementField(element: Element | ComponentPublicInstance | null): void {
    statementField.value = element instanceof HTMLTextAreaElement ? element : null
  }

  const { insertAtCursor, replacePlaceholder } = useCursorInsert(
    statementField,
    () => fields.value?.statementMd ?? null,
    (value) => {
      if (fields.value) fields.value.statementMd = value
    },
  )

  const assetInsert = useAssetInsert(insertAtCursor, replacePlaceholder)

  function sync(problem: ProblemAuthor): void {
    syncing = true
    fields.value = toFields(problem)
    syncing = false
  }

  async function save(): Promise<boolean> {
    if (!dirty.value) return true
    if (!hasValidFields(fields.value)) return false
    return coordinator.enqueueSave(async () => {
      const draft = fields.value
      const problem = loaded.value
      if (!draft || !problem || !dirty.value || !hasValidFields(draft)) return
      const submitted = { ...draft }
      const saved = await updateProblem(problem.id, {
        title: submitted.title,
        statementMd: submitted.statementMd,
        difficulty: submitted.difficulty,
        tags: submitted.tags,
        timeLimitMs: submitted.timeLimitMs,
        memoryLimitKb: submitted.memoryLimitKb,
      })
      const current = loaded.value
      if (!current || current.id !== saved.id) return
      current.title = saved.title
      current.statementMd = saved.statementMd
      current.statementHtml = saved.statementHtml
      current.difficulty = saved.difficulty
      current.tags = saved.tags
      current.timeLimitMs = saved.timeLimitMs
      current.memoryLimitKb = saved.memoryLimitKb
    })
  }

  watch(
    fields,
    () => {
      if (!syncing) debounce.schedule(() => void save())
    },
    { deep: true, flush: 'sync' },
  )

  return {
    fields,
    dirty,
    statementField,
    setStatementField,
    sync,
    save,
    cancelSave: () => {
      debounce.cancel()
    },
    assetInsert,
  }
}

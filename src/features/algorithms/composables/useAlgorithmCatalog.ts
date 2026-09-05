import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { listCatalog } from '@/api/algorithms'
import type { AlgorithmDifficulty, ProblemCard } from '@/api/schemas/algorithms'
import { useVersionedLoad } from '@/composables/useVersionedLoad'

const PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 300

export function useAlgorithmCatalog() {
  const items = ref<ProblemCard[]>([])
  const topics = ref<string[]>([])
  const total = ref(0)
  const pending = ref(true)
  const error = ref<unknown>(null)

  const difficulty = ref<AlgorithmDifficulty | null>(null)
  const topic = ref<string | null>(null)
  const search = ref('')
  const page = ref(0)

  const loadGuard = useVersionedLoad()
  let debounce: ReturnType<typeof setTimeout> | null = null

  const solvedCount = computed(() => items.value.filter((item) => item.solved).length)
  const hasMore = computed(() => (page.value + 1) * PAGE_SIZE < total.value)

  async function load(): Promise<void> {
    const current = loadGuard.start()
    pending.value = true
    error.value = null
    try {
      const catalog = await listCatalog({
        difficulty: difficulty.value ?? undefined,
        topic: topic.value ?? undefined,
        query: search.value.trim() || undefined,
        limit: PAGE_SIZE,
        offset: page.value * PAGE_SIZE,
      })
      if (!loadGuard.isCurrent(current)) return
      items.value = catalog.items
      topics.value = catalog.topics
      total.value = catalog.total
    } catch (cause) {
      if (loadGuard.isCurrent(current)) error.value = cause
    } finally {
      if (loadGuard.isCurrent(current)) pending.value = false
    }
  }

  function resetPageAndLoad(): void {
    page.value = 0
    void load()
  }

  watch([difficulty, topic], resetPageAndLoad)
  watch(page, () => void load())

  watch(search, () => {
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(resetPageAndLoad, SEARCH_DEBOUNCE_MS)
  })

  onMounted(() => void load())
  onUnmounted(() => {
    loadGuard.cancel()
    if (debounce) clearTimeout(debounce)
  })

  return {
    difficulty,
    error,
    hasMore,
    items,
    page,
    pending,
    search,
    solvedCount,
    topic,
    topics,
    total,
  }
}

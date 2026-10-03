import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { listProjects } from '@/api/projects'
import type { ProjectCatalogQuery } from '@/api/projects'
import type { ProjectCard, ProjectLinkKind, ProjectStatus } from '@/api/schemas/projects'
import { useDebounce } from '@/composables/useDebounce'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import {
  DEFAULT_CATALOG_QUERY,
  catalogQueryFromRoute,
  catalogQueryToRoute,
  isCatalogFiltered,
  toggled,
} from '@/lib/projects'

export const SEARCH_DEBOUNCE_MS = 300

/**
 * Каталог проектов. Источник правды для фильтров — query-строка URL:
 * любое изменение фильтра — это router.replace/push, а загрузка идёт от route.query.
 */
export function useProjectCatalog() {
  const route = useRoute()
  const router = useRouter()
  const debounce = useDebounce(SEARCH_DEBOUNCE_MS)
  const versions = useVersionedLoad()

  const filters = computed(() => catalogQueryFromRoute(route.query))
  const search = ref(filters.value.q)
  const items = ref<ProjectCard[]>([])
  const total = ref(0)
  const pending = ref(true)
  const loadingMore = ref(false)
  const error = ref<unknown>(null)

  const filtered = computed(() => isCatalogFiltered(filters.value))
  const hasMore = computed(() => items.value.length < total.value)
  const emptyState = computed<'none' | 'no-projects' | 'no-matches'>(() => {
    if (pending.value || error.value || items.value.length > 0) return 'none'
    return filtered.value ? 'no-matches' : 'no-projects'
  })

  async function load(): Promise<void> {
    const token = versions.start()
    pending.value = true
    error.value = null
    try {
      const page = await listProjects(filters.value)
      if (!versions.isCurrent(token)) return
      items.value = page.items
      total.value = page.total
    } catch (cause) {
      if (versions.isCurrent(token)) error.value = cause
    } finally {
      if (versions.isCurrent(token)) pending.value = false
    }
  }

  async function loadMore(): Promise<void> {
    const token = versions.peek()
    loadingMore.value = true
    try {
      const page = await listProjects(filters.value, items.value.length)
      if (!versions.isCurrent(token)) return
      items.value = [...items.value, ...page.items]
      total.value = page.total
    } catch (cause) {
      error.value = cause
    } finally {
      loadingMore.value = false
    }
  }

  function apply(changes: Partial<ProjectCatalogQuery>, { replace = false } = {}): void {
    const next = catalogQueryToRoute({ ...filters.value, ...changes })
    void (replace ? router.replace({ query: next }) : router.push({ query: next }))
  }

  function toggleStatus(status: ProjectStatus): void {
    apply({ statuses: toggled(filters.value.statuses, status) })
  }

  function toggleLinkKind(kind: ProjectLinkKind): void {
    apply({ linkKinds: toggled(filters.value.linkKinds, kind) })
  }

  function setSort(sort: ProjectCatalogQuery['sort']): void {
    apply({ sort })
  }

  function reset(): void {
    debounce.cancel()
    search.value = ''
    apply({ ...DEFAULT_CATALOG_QUERY, sort: filters.value.sort })
  }

  // Набор текста не плодит записи в истории: поиск пишется через replace.
  watch(search, (value) => {
    if (value === filters.value.q) return
    debounce.schedule(() => {
      apply({ q: value }, { replace: true })
    })
  })
  watch(
    () => filters.value.q,
    (value) => {
      if (value !== search.value.trim()) search.value = value
    },
  )
  watch(
    () => JSON.stringify(filters.value),
    () => void load(),
    { immediate: true },
  )
  onUnmounted(() => {
    debounce.cancel()
    versions.cancel()
  })

  return {
    filters,
    search,
    items,
    total,
    pending,
    loadingMore,
    error,
    filtered,
    hasMore,
    emptyState,
    load,
    loadMore,
    toggleStatus,
    toggleLinkKind,
    setSort,
    reset,
  }
}

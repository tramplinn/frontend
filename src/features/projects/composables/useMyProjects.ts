import { computed, ref } from 'vue'

import { listMyProjects } from '@/api/projects'
import type { ProjectCard, ProjectRole, ProjectStatus } from '@/api/schemas/projects'
import { toggled } from '@/lib/projects'

export interface MyProjectsFilter {
  q: string
  statuses: ProjectStatus[]
  role: ProjectRole | ''
}

/** «Мои проекты» приходят целиком, поэтому фильтруем на клиенте. */
export function filterMyProjects(items: ProjectCard[], filter: MyProjectsFilter): ProjectCard[] {
  const needle = filter.q.trim().toLowerCase()
  return items.filter(
    (item) =>
      (needle === '' ||
        item.title.toLowerCase().includes(needle) ||
        (item.summary ?? '').toLowerCase().includes(needle)) &&
      (filter.statuses.length === 0 || filter.statuses.includes(item.status)) &&
      (filter.role === '' || item.myRole === filter.role),
  )
}

export function useMyProjects() {
  const items = ref<ProjectCard[]>([])
  const pending = ref(false)
  const loaded = ref(false)
  const error = ref<unknown>(null)
  const filter = ref<MyProjectsFilter>({ q: '', statuses: [], role: '' })

  const visible = computed(() => filterMyProjects(items.value, filter.value))

  async function load(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      items.value = await listMyProjects()
      loaded.value = true
    } catch (cause) {
      error.value = cause
    } finally {
      pending.value = false
    }
  }

  function toggleStatus(status: ProjectStatus): void {
    filter.value = { ...filter.value, statuses: toggled(filter.value.statuses, status) }
  }

  function reset(): void {
    filter.value = { q: '', statuses: [], role: '' }
  }

  return { items, visible, pending, loaded, error, filter, load, toggleStatus, reset }
}

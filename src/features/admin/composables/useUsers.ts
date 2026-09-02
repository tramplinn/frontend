import { onMounted, onUnmounted, ref, watch } from 'vue'

import { listUsers, updateUser } from '@/api/admin'
import type { User } from '@/api/schemas/auth'
import type { UserRole } from '@/api/schemas/common'

const SEARCH_DEBOUNCE_MS = 250

export function useUsers() {
  const users = ref<User[]>([])
  const total = ref(0)
  const query = ref('')
  const roleFilter = ref<UserRole | ''>('')
  const pending = ref(true)
  const error = ref<unknown>(null)
  const actionError = ref<unknown>(null)
  const savingIds = ref(new Set<string>())

  let debounce: ReturnType<typeof setTimeout> | undefined
  let loadVersion = 0

  async function load(): Promise<void> {
    const version = ++loadVersion
    const filters = { query: query.value, role: roleFilter.value }
    pending.value = true
    error.value = null
    try {
      const page = await listUsers({
        ...(filters.query ? { q: filters.query } : {}),
        ...(filters.role ? { role: filters.role } : {}),
      })
      if (version !== loadVersion) return
      users.value = page.items
      total.value = page.total
    } catch (cause) {
      if (version === loadVersion) error.value = cause
    } finally {
      if (version === loadVersion) pending.value = false
    }
  }

  async function patch(user: User, changes: Parameters<typeof updateUser>[1]): Promise<void> {
    savingIds.value = new Set(savingIds.value).add(user.id)
    actionError.value = null
    try {
      const updated = await updateUser(user.id, changes)
      users.value = users.value.map((item) => (item.id === updated.id ? updated : item))
    } catch (cause) {
      actionError.value = cause
    } finally {
      const next = new Set(savingIds.value)
      next.delete(user.id)
      savingIds.value = next
    }
  }

  onMounted(() => void load())
  watch([query, roleFilter], () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => void load(), SEARCH_DEBOUNCE_MS)
  })
  onUnmounted(() => {
    clearTimeout(debounce)
    loadVersion += 1
  })

  return {
    actionError,
    error,
    patch,
    pending,
    query,
    roleFilter,
    savingIds,
    total,
    users,
  }
}

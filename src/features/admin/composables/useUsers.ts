import { onMounted, onUnmounted, ref, watch } from 'vue'

import { listUsers, updateUser } from '@/api/admin'
import type { User } from '@/api/schemas/auth'
import type { UserRole } from '@/api/schemas/common'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import { runBusyAction } from '@/lib/asyncAction'

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
  const loadGuard = useVersionedLoad()

  async function load(): Promise<void> {
    const version = loadGuard.start()
    const filters = { query: query.value, role: roleFilter.value }
    pending.value = true
    error.value = null
    try {
      const page = await listUsers({
        ...(filters.query ? { q: filters.query } : {}),
        ...(filters.role ? { role: filters.role } : {}),
      })
      if (!loadGuard.isCurrent(version)) return
      users.value = page.items
      total.value = page.total
    } catch (cause) {
      if (loadGuard.isCurrent(version)) error.value = cause
    } finally {
      if (loadGuard.isCurrent(version)) pending.value = false
    }
  }

  async function patch(user: User, changes: Parameters<typeof updateUser>[1]): Promise<void> {
    await runBusyAction(
      {
        setBusy: (active) => {
          if (active) savingIds.value = new Set(savingIds.value).add(user.id)
          else {
            const next = new Set(savingIds.value)
            next.delete(user.id)
            savingIds.value = next
          }
        },
        clearError: () => (actionError.value = null),
        setError: (cause) => (actionError.value = cause),
      },
      async () => {
        const updated = await updateUser(user.id, changes)
        users.value = users.value.map((item) => (item.id === updated.id ? updated : item))
      },
    )
  }

  onMounted(() => void load())
  watch([query, roleFilter], () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => void load(), SEARCH_DEBOUNCE_MS)
  })
  onUnmounted(() => {
    clearTimeout(debounce)
    loadGuard.cancel()
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

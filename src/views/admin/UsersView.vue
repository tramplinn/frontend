<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { listGroups, listUsers, updateUser } from '@/api/admin'
import type { StudentGroup } from '@/api/schemas/admin'
import type { User } from '@/api/schemas/auth'
import type { UserRole } from '@/api/schemas/common'
import AppSelect from '@/components/ui/AppSelect.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { errorText } from '@/lib/errors'
import { withCount } from '@/lib/plural'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'студент' },
  { value: 'teacher', label: 'преподаватель' },
  { value: 'admin', label: 'админ' },
]

const users = ref<User[]>([])
const groups = ref<StudentGroup[]>([])
const total = ref(0)
const query = ref('')
const roleFilter = ref<UserRole | ''>('')
const pending = ref(true)
const error = ref<unknown>(null)
const actionError = ref<unknown>(null)
const savingId = ref<string | null>(null)

const groupName = computed(() => new Map(groups.value.map((group) => [group.id, group.name])))

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    const page = await listUsers({
      ...(query.value ? { q: query.value } : {}),
      ...(roleFilter.value ? { role: roleFilter.value } : {}),
    })
    users.value = page.items
    total.value = page.total
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

async function patch(user: User, changes: Parameters<typeof updateUser>[1]): Promise<void> {
  savingId.value = user.id
  actionError.value = null
  const before = { ...user }
  try {
    const updated = await updateUser(user.id, changes)
    users.value = users.value.map((item) => (item.id === updated.id ? updated : item))
  } catch (cause) {
    users.value = users.value.map((item) => (item.id === before.id ? before : item))
    actionError.value = cause
  } finally {
    savingId.value = null
  }
}

onMounted(() => {
  void listGroups()
    .then((loaded) => (groups.value = loaded))
    .catch(() => {})
  void load()
})

let debounce: ReturnType<typeof setTimeout> | undefined
watch([query, roleFilter], () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => void load(), 250)
})

onUnmounted(() => {
  clearTimeout(debounce)
})
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">пользователи</h1>
      <p class="meta">{{ withCount(total, 'человек', 'человека', 'человек') }}</p>
    </header>

    <div class="filters">
      <input
        v-model="query"
        class="text-field input"
        type="search"
        placeholder="имя, логин или почта"
      />
      <div class="pills" role="group" aria-label="Роль">
        <button
          type="button"
          class="pill"
          :aria-pressed="roleFilter === ''"
          @click="roleFilter = ''"
        >
          все
        </button>
        <button
          v-for="role in ROLES"
          :key="role.value"
          type="button"
          class="pill"
          :aria-pressed="roleFilter === role.value"
          @click="roleFilter = role.value"
        >
          {{ role.label }}
        </button>
      </div>
    </div>

    <p v-if="actionError" class="action-error" role="alert">{{ errorText(actionError) }}</p>

    <LoadState :pending="pending" :error="error">
      <p v-if="users.length === 0" class="empty">никого не нашлось</p>

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>человек</th>
              <th>группа</th>
              <th>роль</th>
              <th class="right">доступ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{ dimmed: !user.isActive }">
              <td>
                <span class="name">{{ user.name ?? user.login }}</span>
                <span class="login">{{ user.login }}</span>
              </td>
              <td class="muted">
                {{ user.groupId === null ? '—' : (groupName.get(user.groupId) ?? user.groupId) }}
              </td>
              <td>
                <AppSelect
                  :model-value="user.role"
                  :options="ROLES"
                  :label="`Роль: ${user.login}`"
                  :disabled="savingId === user.id"
                  @update:model-value="(role) => patch(user, { role })"
                />
              </td>
              <td class="right">
                <button
                  type="button"
                  class="toggle"
                  :class="{ 'toggle--off': !user.isActive }"
                  :disabled="savingId === user.id"
                  @click="patch(user, { isActive: !user.isActive })"
                >
                  {{ user.isActive ? 'активен' : 'отключён' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </LoadState>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: var(--space-6);
}

.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.meta {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.input {
  width: 280px;
}

.pills {
  display: flex;
  gap: var(--space-2);
}

.pill {
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.pill:hover {
  color: var(--text);
}

.pill[aria-pressed='true'] {
  background: var(--selected);
  color: var(--on-selected);
}

.action-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.table-wrap {
  overflow-x: auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-caption);
}

.table th,
.table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table th {
  color: var(--text-muted);
  font-weight: var(--weight-regular);
}

.right {
  text-align: right;
}

.dimmed td {
  opacity: 0.55;
}

.name {
  display: block;
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
}

.login,
.muted {
  color: var(--text-muted);
}

.toggle {
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--success-soft);
  color: var(--success);
  font-family: inherit;
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  cursor: pointer;
}

.toggle--off {
  background: var(--surface);
  color: var(--text-muted);
}

.toggle:disabled {
  opacity: 0.5;
  cursor: default;
}

.empty {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

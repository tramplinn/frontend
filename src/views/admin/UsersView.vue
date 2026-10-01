<script setup lang="ts">
import type { UserRole } from '@/api/schemas/common'
import AppSelect from '@/components/ui/AppSelect.vue'
import FilterChip from '@/components/ui/FilterChip.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useUsers } from '@/features/admin/composables/useUsers'
import { errorText } from '@/lib/errors'
import { computed } from 'vue'

import { useI18n } from '@/i18n'

const { t, tc } = useI18n()

const ROLE_VALUES: UserRole[] = ['student', 'teacher', 'admin']
const ROLES = computed(() => ROLE_VALUES.map((value) => ({ value, label: t(`roles.${value}`) })))

const { users, total, query, roleFilter, pending, error, actionError, savingIds, patch, load } =
  useUsers()
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">{{ t('admin.heading') }}</h1>
      <p class="meta">{{ tc('units.people', total) }}</p>
    </header>

    <div class="filters">
      <input
        v-model="query"
        class="text-field input"
        type="search"
        :placeholder="t('admin.search')"
      />
      <div class="pills" role="group" :aria-label="t('admin.role')">
        <FilterChip :pressed="roleFilter === ''" @click="roleFilter = ''">
          {{ t('admin.all') }}
        </FilterChip>
        <FilterChip
          v-for="role in ROLES"
          :key="role.value"
          :pressed="roleFilter === role.value"
          @click="roleFilter = role.value"
        >
          {{ role.label }}
        </FilterChip>
      </div>
    </div>

    <p v-if="actionError" class="action-error" role="alert">{{ errorText(actionError) }}</p>

    <LoadState :pending="pending" :error="error" @retry="load">
      <p v-if="users.length === 0" class="empty">{{ t('people.empty') }}</p>

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('admin.person') }}</th>
              <th>{{ t('admin.roleColumn') }}</th>
              <th class="right">{{ t('admin.access') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{ dimmed: !user.isActive }">
              <td>
                <span class="name">{{ user.name ?? user.login }}</span>
                <span class="login">{{ user.login }}</span>
              </td>
              <td>
                <AppSelect
                  :model-value="user.role"
                  :options="ROLES"
                  :label="t('admin.roleOf', { login: user.login })"
                  :disabled="savingIds.has(user.id)"
                  @update:model-value="(role) => patch(user, { role })"
                />
              </td>
              <td class="right">
                <button
                  type="button"
                  class="toggle"
                  :class="{ 'toggle--off': !user.isActive }"
                  :disabled="savingIds.has(user.id)"
                  @click="patch(user, { isActive: !user.isActive })"
                >
                  {{ user.isActive ? t('admin.active') : t('admin.disabled') }}
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

@media (max-width: 620px) {
  .input,
  .pills {
    width: 100%;
  }

  .pills {
    overflow-x: auto;
    padding-bottom: var(--space-1);
  }

  .pills :deep(.chip) {
    flex-shrink: 0;
  }

  .table th,
  .table td {
    padding-inline: var(--space-3);
    white-space: nowrap;
  }
}
</style>

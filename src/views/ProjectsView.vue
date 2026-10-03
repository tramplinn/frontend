<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { ProjectRole, ProjectSort } from '@/api/schemas/projects'
import SignInGate from '@/components/layout/SignInGate.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FilterChip from '@/components/ui/FilterChip.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useMyProjects } from '@/features/projects/composables/useMyProjects'
import { useProjectCatalog } from '@/features/projects/composables/useProjectCatalog'
import { useI18n } from '@/i18n'
import {
  PROJECT_LINK_KINDS,
  PROJECT_ROLES,
  PROJECT_SORTS,
  PROJECT_STATUSES,
  linkKindFilterLabel,
  roleLabel,
  sortLabel,
  statusLabel,
} from '@/lib/projects'
import { useAuthStore } from '@/stores/auth'

const { t, tc } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const tab = computed<'all' | 'mine'>(() => (route.query.tab === 'mine' ? 'mine' : 'all'))
const catalog = useProjectCatalog()
const mine = useMyProjects()

const sortOptions = computed(() =>
  PROJECT_SORTS.map((value) => ({ value, label: sortLabel(value) })),
)
const roleOptions = computed<{ value: ProjectRole | ''; label: string }[]>(() => [
  { value: '', label: t('projects.catalog.anyRole') },
  ...PROJECT_ROLES.map((value) => ({ value, label: roleLabel(value) })),
])

function openTab(next: 'all' | 'mine'): void {
  // Фильтры каталога и вкладка «Мои» независимы: при переключении query не теряем.
  const query = { ...route.query }
  if (next === 'mine') query.tab = 'mine'
  else delete query.tab
  void router.push({ query })
}

watch(
  () => [tab.value, auth.isAuthenticated] as const,
  ([current, signedIn]) => {
    if (current === 'mine' && signedIn && !mine.loaded.value) void mine.load()
  },
  { immediate: true },
)
</script>

<template>
  <section class="projects">
    <header class="head">
      <div>
        <h1>{{ t('projects.heading') }}</h1>
        <p class="lead">{{ t('projects.lead') }}</p>
      </div>
      <AppButton
        v-if="auth.isAuthenticated"
        variant="primary"
        @click="router.push({ name: 'project-create' })"
      >
        {{ t('projects.create') }}
      </AppButton>
    </header>

    <nav class="tabs" :aria-label="t('projects.heading')">
      <FilterChip :pressed="tab === 'all'" @click="openTab('all')">{{
        t('projects.tabs.all')
      }}</FilterChip>
      <FilterChip :pressed="tab === 'mine'" @click="openTab('mine')">{{
        t('projects.tabs.mine')
      }}</FilterChip>
    </nav>

    <template v-if="tab === 'all'">
      <div class="filters">
        <input
          v-model="catalog.search.value"
          class="text-field search"
          type="search"
          maxlength="200"
          :placeholder="t('projects.catalog.search')"
        />
        <AppSelect
          :model-value="catalog.filters.value.sort"
          :options="sortOptions"
          :label="t('projects.catalog.sort')"
          @update:model-value="(value: ProjectSort) => catalog.setSort(value)"
        />
        <AppButton v-if="catalog.filtered.value" size="sm" variant="quiet" @click="catalog.reset">
          {{ t('projects.catalog.reset') }}
        </AppButton>
      </div>
      <div class="chips" role="group" :aria-label="t('projects.catalog.statuses')">
        <FilterChip
          v-for="status in PROJECT_STATUSES"
          :key="status"
          :class="`status status--${status}`"
          :pressed="catalog.filters.value.statuses.includes(status)"
          @click="catalog.toggleStatus(status)"
          >{{ statusLabel(status) }}</FilterChip
        >
      </div>
      <div class="chips" role="group" :aria-label="t('projects.catalog.links')">
        <FilterChip
          v-for="kind in PROJECT_LINK_KINDS"
          :key="kind"
          :pressed="catalog.filters.value.linkKinds.includes(kind)"
          @click="catalog.toggleLinkKind(kind)"
          >{{ linkKindFilterLabel(kind) }}</FilterChip
        >
      </div>
      <p v-if="catalog.filters.value.member" class="member-filter">
        {{ t('projects.catalog.memberFilter', { login: catalog.filters.value.member }) }}
      </p>

      <LoadState
        :pending="catalog.pending.value"
        :error="catalog.error.value"
        @retry="catalog.load"
      >
        <p v-if="catalog.emptyState.value === 'no-projects'" class="empty">
          {{ t('projects.catalog.emptyAll') }}
        </p>
        <p v-else-if="catalog.emptyState.value === 'no-matches'" class="empty">
          {{ t('projects.catalog.emptyFiltered') }}
        </p>
        <template v-else>
          <p class="total">{{ tc('projects.catalog.total', catalog.total.value) }}</p>
          <div class="grid">
            <ProjectCard
              v-for="project in catalog.items.value"
              :key="project.id"
              :project="project"
            />
          </div>
          <AppButton
            v-if="catalog.hasMore.value"
            class="more"
            :loading="catalog.loadingMore.value"
            @click="catalog.loadMore"
            >{{ t('projects.catalog.more') }}</AppButton
          >
        </template>
      </LoadState>
    </template>

    <template v-else>
      <SignInGate
        v-if="!auth.isAuthenticated"
        :title="t('projects.gateTitle')"
        :text="t('projects.gateText')"
      />
      <template v-else>
        <div class="filters">
          <input
            v-model="mine.filter.value.q"
            class="text-field search"
            type="search"
            :placeholder="t('projects.catalog.search')"
          />
          <AppSelect
            v-model="mine.filter.value.role"
            :options="roleOptions"
            :label="t('projects.catalog.role')"
          />
        </div>
        <div class="chips" role="group" :aria-label="t('projects.catalog.statuses')">
          <FilterChip
            v-for="status in PROJECT_STATUSES"
            :key="status"
            :pressed="mine.filter.value.statuses.includes(status)"
            @click="mine.toggleStatus(status)"
            >{{ statusLabel(status) }}</FilterChip
          >
        </div>
        <LoadState :pending="mine.pending.value" :error="mine.error.value" @retry="mine.load">
          <p v-if="mine.items.value.length === 0" class="empty">
            {{ t('projects.catalog.emptyMine') }}
          </p>
          <p v-else-if="mine.visible.value.length === 0" class="empty">
            {{ t('projects.catalog.emptyFiltered') }}
          </p>
          <div v-else class="grid">
            <ProjectCard
              v-for="project in mine.visible.value"
              :key="project.id"
              :project="project"
              :subtitle="project.memberTitle"
              show-role
            />
          </div>
        </LoadState>
      </template>
    </template>
  </section>
</template>

<style scoped>
.projects {
  max-width: 1100px;
}
.head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.head h1 {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}
.lead,
.total,
.member-filter,
.empty {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.tabs,
.chips,
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.tabs {
  margin-bottom: var(--space-6);
}
.search {
  width: min(440px, 100%);
}
.status[aria-pressed='true'].status--idea {
  background: var(--icon-purple-soft);
  color: var(--icon-purple);
}
.status[aria-pressed='true'].status--planning {
  background: var(--icon-cyan-soft);
  color: var(--icon-cyan);
}
.status[aria-pressed='true'].status--in_progress {
  background: var(--accent-soft);
  color: var(--accent);
}
.status[aria-pressed='true'].status--paused {
  background: var(--warning-soft);
  color: var(--warning);
}
.status[aria-pressed='true'].status--done {
  background: var(--success-soft);
  color: var(--success);
}
.total {
  margin-bottom: var(--space-3);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}
.more {
  margin-top: var(--space-6);
}
@media (max-width: 700px) {
  .head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

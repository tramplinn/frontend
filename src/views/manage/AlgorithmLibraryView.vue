<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createProblem, deleteProblem, listProblems } from '@/api/algorithmAuthoring'
import type { ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { DIFFICULTY_ORDER, difficultyLabel, languageLabel } from '@/lib/algorithms'
import { errorText } from '@/lib/errors'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const router = useRouter()

const problems = ref<ProblemAuthor[]>([])
const pending = ref(true)
const error = ref<unknown>(null)
const actionError = ref<string | null>(null)
const busy = ref<string | null>(null)

const difficulty = ref<AlgorithmDifficulty>('easy')

const difficultyOptions = computed(() =>
  DIFFICULTY_ORDER.map((value) => ({ value, label: difficultyLabel(value) })),
)

const published = computed(
  () => problems.value.filter((item) => item.status === 'published').length,
)

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    problems.value = await listProblems()
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

async function create(value: { title: string }): Promise<void> {
  busy.value = 'new'
  actionError.value = null
  try {
    const created = await createProblem({ title: value.title, difficulty: difficulty.value })
    await router.push({ name: 'manage-algorithm', params: { problem: created.id } })
  } catch (cause) {
    actionError.value = errorText(cause)
  } finally {
    busy.value = null
  }
}

async function remove(problemId: string): Promise<void> {
  busy.value = problemId
  actionError.value = null
  try {
    await deleteProblem(problemId)
    problems.value = problems.value.filter((item) => item.id !== problemId)
  } catch (cause) {
    actionError.value = errorText(cause)
  } finally {
    busy.value = null
  }
}

onMounted(() => void load())
</script>

<template>
  <section class="page">
    <header class="head">
      <div>
        <h1>{{ t('library.heading') }}</h1>
        <p v-if="problems.length > 0" class="muted">
          {{ t('library.publishedOf', { published, total: problems.length }) }}
        </p>
      </div>
      <InlineCreate
        :label="t('library.problem')"
        :placeholder="t('library.newTitle')"
        :saving="busy === 'new'"
        :show-slug="false"
        @create="create"
      >
        <template #fields>
          <AppSelect
            v-model="difficulty"
            :options="difficultyOptions"
            :label="t('library.difficulty')"
          />
        </template>
      </InlineCreate>
    </header>

    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

    <LoadState :pending="pending" :error="error" @retry="load">
      <p v-if="problems.length === 0" class="muted empty">{{ t('library.empty') }}</p>

      <ul v-else class="list">
        <li v-for="item in problems" :key="item.id" class="row">
          <RouterLink
            :to="{ name: 'manage-algorithm', params: { problem: item.id } }"
            class="row-main"
          >
            <span class="row-title">{{ item.title }}</span>
            <span class="row-meta">
              <DifficultyChip :difficulty="item.difficulty" />
              <StatusChip :status="item.status" />
              <span class="counts">
                {{
                  t('library.counts', {
                    tests: item.testCases.length,
                    samples: item.testCases.filter((test) => test.isSample).length,
                  })
                }}
              </span>
              <span v-if="item.templates.length > 0" class="counts">
                {{ item.templates.map((tpl) => languageLabel(tpl.language)).join(' · ') }}
              </span>
            </span>
          </RouterLink>

          <ConfirmButton :loading="busy === item.id" @confirm="remove(item.id)" />
        </li>
      </ul>
    </LoadState>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.head h1 {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.muted,
.counts {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.head .muted {
  margin-top: var(--space-1);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.list {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.row-main {
  display: grid;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.row-title {
  font-weight: var(--weight-medium);
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.empty {
  padding: var(--space-12) 0;
}
</style>

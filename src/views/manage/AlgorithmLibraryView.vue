<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createProblem, deleteProblem, listProblems } from '@/api/algorithmAuthoring'
import type { ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import ManageList from '@/components/manage/ManageList.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
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
  <section>
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

      <ManageList
        v-else
        :items="problems"
        :to="(item) => ({ name: 'manage-algorithm', params: { problem: item.id } })"
      >
        <template #badges="{ item }">
          <DifficultyChip :difficulty="item.difficulty" />
          <StatusChip :status="item.status" />
        </template>
        <template #meta="{ item }">
          <span>
            {{
              t('library.counts', {
                tests: item.testCases.length,
                samples: item.testCases.filter((test) => test.isSample).length,
              })
            }}
          </span>
          <span v-if="item.templates.length > 0">
            {{ item.templates.map((tpl) => languageLabel(tpl.language)).join(' · ') }}
          </span>
        </template>
        <template #actions="{ item }">
          <RowMenu :disabled="busy !== null" :label="t('manage.actionsFor', { title: item.title })">
            <RowMenuItem danger @select="remove(item.id)">{{ t('ui.delete') }}</RowMenuItem>
          </RowMenu>
        </template>
      </ManageList>
    </LoadState>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.head h1 {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.muted {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.head .muted {
  margin-top: var(--space-1);
}

.error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.empty {
  padding: var(--space-12) 0;
}
</style>

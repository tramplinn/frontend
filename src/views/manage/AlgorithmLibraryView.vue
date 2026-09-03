<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createProblem, deleteProblem, listProblems } from '@/api/algorithmAuthoring'
import type { ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, languageLabel } from '@/lib/algorithms'
import { errorText } from '@/lib/errors'

const router = useRouter()

const problems = ref<ProblemAuthor[]>([])
const pending = ref(true)
const error = ref<unknown>(null)
const actionError = ref<string | null>(null)
const busy = ref<string | null>(null)

const title = ref('')
const difficulty = ref<AlgorithmDifficulty>('easy')

const difficultyOptions = DIFFICULTY_ORDER.map((value) => ({
  value,
  label: DIFFICULTY_LABELS[value],
}))

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

async function create(): Promise<void> {
  if (!title.value.trim()) return
  busy.value = 'new'
  actionError.value = null
  try {
    const created = await createProblem({ title: title.value.trim(), difficulty: difficulty.value })
    title.value = ''
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
        <h1>алгозадачи</h1>
        <p class="muted">
          Общая библиотека: одну задачу можно положить в любое число наборов практики.
        </p>
      </div>
      <p v-if="problems.length > 0" class="muted">
        опубликовано {{ published }} из {{ problems.length }}
      </p>
    </header>

    <form class="create" @submit.prevent="create">
      <input
        v-model="title"
        type="text"
        placeholder="название новой задачи"
        aria-label="Название"
      />
      <AppSelect v-model="difficulty" :options="difficultyOptions" label="Сложность" />
      <AppButton
        type="submit"
        variant="primary"
        :loading="busy === 'new'"
        :disabled="!title.trim()"
      >
        создать
      </AppButton>
    </form>

    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

    <LoadState :pending="pending" :error="error">
      <p v-if="problems.length === 0" class="muted empty">Задач пока нет. Создай первую выше.</p>

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
                тестов: {{ item.testCases.length }} · примеров:
                {{ item.testCases.filter((test) => test.isSample).length }}
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
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.head h1 {
  font-size: var(--text-display);
}

.muted,
.counts {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.create {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.create input {
  flex: 1;
  min-width: 220px;
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-input);
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

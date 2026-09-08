<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import {
  addSetProblem,
  getPracticeSet,
  listProblems,
  removeSetProblem,
  reorderSetProblems,
  updatePracticeSet,
} from '@/api/algorithmAuthoring'
import type { PracticeSetAuthor, ProblemAuthor } from '@/api/schemas/algorithmAuthoring'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import BackLink from '@/components/ui/BackLink.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { errorText } from '@/lib/errors'

const props = defineProps<{ set: string }>()

const loaded = ref<PracticeSetAuthor | null>(null)
const library = ref<ProblemAuthor[]>([])
const pending = ref(true)
const error = ref<unknown>(null)
const actionError = ref<string | null>(null)
const busy = ref<string | null>(null)

const title = ref('')
const description = ref('')
const mode = ref<'practice' | 'mock_interview'>('practice')
const duration = ref<number | null>(null)
const picked = ref('')

const modeOptions = [
  { value: 'practice' as const, label: 'практика' },
  { value: 'mock_interview' as const, label: 'интервью на время' },
]

const inSet = computed(() => new Set(loaded.value?.problems.map((item) => item.problemId)))

/** В набор можно класть только опубликованные задачи — черновик студент не откроет. */
const available = computed(() =>
  library.value.filter((item) => item.status === 'published' && !inSet.value.has(item.id)),
)

const pickOptions = computed(() =>
  available.value.map((item) => ({ value: item.id, label: item.title })),
)

const publishBlockers = computed(() => {
  const value = loaded.value
  if (!value) return []
  const blockers: string[] = []
  if (value.problems.length === 0) blockers.push('в наборе нет задач')
  if (value.mode === 'mock_interview' && !value.durationMinutes) {
    blockers.push('для интервью не задана длительность')
  }
  return blockers
})

function sync(value: PracticeSetAuthor): void {
  loaded.value = value
  title.value = value.title
  description.value = value.description
  mode.value = value.mode
  duration.value = value.durationMinutes
}

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    const [set, problems] = await Promise.all([getPracticeSet(props.set), listProblems()])
    sync(set)
    library.value = problems
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

async function run(key: string, action: () => Promise<PracticeSetAuthor | null>): Promise<void> {
  busy.value = key
  actionError.value = null
  try {
    const result = await action()
    if (result) sync(result)
    else sync(await getPracticeSet(props.set))
  } catch (cause) {
    actionError.value = errorText(cause)
  } finally {
    busy.value = null
  }
}

function save(): void {
  void run('set', () =>
    updatePracticeSet(props.set, {
      title: title.value,
      description: description.value,
      mode: mode.value,
      durationMinutes: mode.value === 'mock_interview' ? duration.value : null,
    }),
  )
}

function togglePublished(): void {
  const value = loaded.value
  if (!value) return
  void run('publish', () =>
    updatePracticeSet(props.set, {
      status: value.status === 'published' ? 'draft' : 'published',
    }),
  )
}

function add(): void {
  if (!picked.value) return
  const problemId = picked.value
  picked.value = ''
  void run('add', () => addSetProblem(props.set, problemId, null))
}

function remove(problemId: string): void {
  void run(`problem:${problemId}`, async () => {
    await removeSetProblem(props.set, problemId)
    return null
  })
}

function move(index: number, delta: number): void {
  const value = loaded.value
  if (!value) return
  const ids = value.problems.map((item) => item.problemId)
  const next = index + delta
  if (next < 0 || next >= ids.length) return
  const swapped = [...ids]
  const current = swapped[index]
  const target = swapped[next]
  if (current === undefined || target === undefined) return
  swapped[index] = target
  swapped[next] = current
  void run('order', async () => {
    await reorderSetProblems(props.set, swapped)
    return null
  })
}

watch(
  () => props.set,
  () => void load(),
)
onMounted(() => void load())
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <section v-if="loaded" class="page">
      <header class="head">
        <div class="head-main">
          <h1>{{ loaded.title }}</h1>
          <StatusChip :status="loaded.status" />
        </div>
        <div class="head-actions">
          <AppButton
            size="sm"
            :loading="busy === 'publish'"
            :disabled="loaded.status === 'draft' && publishBlockers.length > 0"
            @click="togglePublished"
          >
            {{ loaded.status === 'published' ? 'снять с публикации' : 'опубликовать' }}
          </AppButton>
          <BackLink :to="{ name: 'manage-content' }">к контенту</BackLink>
        </div>
      </header>

      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

      <ul v-if="loaded.status === 'draft' && publishBlockers.length > 0" class="blockers">
        <li v-for="blocker in publishBlockers" :key="blocker">{{ blocker }}</li>
      </ul>

      <section class="card">
        <h2>настройки набора</h2>
        <div class="grid">
          <label class="field">
            <span>название</span>
            <input v-model="title" type="text" class="form-field" />
          </label>

          <div class="field">
            <span>режим</span>
            <AppSelect v-model="mode" :options="modeOptions" label="Режим набора" />
          </div>

          <label v-if="mode === 'mock_interview'" class="field">
            <span>длительность, минут</span>
            <input v-model.number="duration" type="number" min="1" max="480" class="form-field" />
          </label>
        </div>

        <label class="field">
          <span>описание</span>
          <textarea v-model="description" rows="3" class="form-field" />
        </label>

        <div class="row">
          <AppButton variant="primary" :loading="busy === 'set'" @click="save">
            сохранить набор
          </AppButton>
        </div>
      </section>

      <section class="card">
        <h2>задачи</h2>

        <p v-if="loaded.problems.length === 0" class="muted">
          Набор пуст. Добавь задачи из библиотеки — там же они создаются.
        </p>

        <ol v-else class="problems">
          <li v-for="(item, index) in loaded.problems" :key="item.problemId" class="problem">
            <span class="num">{{ index + 1 }}</span>
            <RouterLink
              :to="{ name: 'manage-algorithm', params: { problem: item.problemId } }"
              class="problem-title"
            >
              {{ item.title }}
            </RouterLink>
            <DifficultyChip :difficulty="item.difficulty" />
            <div class="problem-actions">
              <AppButton
                size="sm"
                :disabled="index === 0 || busy === 'order'"
                @click="move(index, -1)"
              >
                выше
              </AppButton>
              <AppButton
                size="sm"
                :disabled="index === loaded.problems.length - 1 || busy === 'order'"
                @click="move(index, 1)"
              >
                ниже
              </AppButton>
              <ConfirmButton
                label="убрать"
                confirm-label="точно убрать?"
                :loading="busy === `problem:${item.problemId}`"
                @confirm="remove(item.problemId)"
              />
            </div>
          </li>
        </ol>

        <div v-if="pickOptions.length > 0" class="row">
          <AppSelect v-model="picked" :options="pickOptions" label="Задача из библиотеки" />
          <AppButton :loading="busy === 'add'" :disabled="!picked" @click="add">
            добавить в набор
          </AppButton>
        </div>
        <p v-else class="muted">
          Свободных опубликованных задач нет.
          <RouterLink :to="{ name: 'manage-algorithms' }">Создать в библиотеке</RouterLink>
        </p>
      </section>
    </section>
  </LoadState>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.head-main,
.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.head h1 {
  font-size: var(--text-display);
}

.muted {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.blockers {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-8);
  border: 1px solid var(--warning);
  border-radius: var(--radius-card);
  background: var(--warning-soft);
  color: var(--warning);
  font-size: var(--text-caption);
}

.card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

h2 {
  font-size: var(--text-title);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
  align-items: end;
}

.field {
  display: grid;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.problems {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}

.problem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
}

.num {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.problem-title {
  flex: 1;
  min-width: 0;
  color: inherit;
}

.problem-actions {
  display: flex;
  gap: var(--space-2);
}
</style>

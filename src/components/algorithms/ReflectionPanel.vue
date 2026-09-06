<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { listAlgorithmSolutions } from '@/api/algorithms'
import type { AlgorithmSolution } from '@/api/schemas/algorithms'
import AppButton from '@/components/ui/AppButton.vue'
import type { useProblemRunner } from '@/features/algorithms/composables/useProblemRunner'
import { languageLabel } from '@/lib/algorithms'

const props = defineProps<{ runner: ReturnType<typeof useProblemRunner> }>()

const emit = defineEmits<{
  save: [
    draft: { complexityMd: string | null; confidence: number | null; reflectionMd: string | null },
  ]
}>()

const { problem, progress, restarted, savingReflection } = props.runner

const complexity = ref('')
const confidence = ref<number | null>(null)
const notes = ref('')

// Разбор задачи пишется после решения, поэтому подтягиваем то, что уже сохранено.
watch(
  progress,
  (value) => {
    complexity.value = value?.complexityMd ?? ''
    confidence.value = value?.confidence ?? null
    notes.value = value?.reflectionMd ?? ''
  },
  { immediate: true },
)

function save(): void {
  emit('save', {
    complexityMd: complexity.value.trim() || null,
    confidence: confidence.value,
    reflectionMd: notes.value.trim() || null,
  })
}

/* Решить-заново прячет историю до следующего захода: старые решения не должны
   отвлекать от чистого повторного прохождения задачи. */
const showHistory = computed(() => progress.value?.status === 'solved' && !restarted.value)

const solutions = ref<AlgorithmSolution[]>([])
const solutionsLoaded = ref(false)
const loadingSolutions = ref(false)
const selectedId = ref('')

const selectedSolution = computed(
  () => solutions.value.find((item) => item.id === selectedId.value) ?? null,
)

async function loadSolutions(): Promise<void> {
  const current = problem.value
  if (!current || loadingSolutions.value || solutionsLoaded.value) return
  loadingSolutions.value = true
  try {
    solutions.value = await listAlgorithmSolutions(current.id)
    selectedId.value = solutions.value[0]?.id ?? ''
  } catch {
    solutions.value = []
  } finally {
    solutionsLoaded.value = true
    loadingSolutions.value = false
  }
}

watch(showHistory, (value) => {
  if (!value) {
    solutions.value = []
    solutionsLoaded.value = false
    selectedId.value = ''
  }
})

function formatFinishedAt(value: string | null): string {
  return value ? new Date(value).toLocaleString() : ''
}
</script>

<template>
  <details class="reflection">
    <summary>разбор решения</summary>

    <div class="body">
      <label class="field">
        <span>сложность</span>
        <input v-model="complexity" type="text" placeholder="O(n log n) по времени, O(n) памяти" />
      </label>

      <fieldset class="field">
        <legend>уверенность</legend>
        <div class="scale">
          <button
            v-for="value in [1, 2, 3, 4, 5]"
            :key="value"
            type="button"
            class="dot"
            :class="{ 'dot--on': confidence !== null && value <= confidence }"
            :aria-pressed="confidence === value"
            :aria-label="`уверенность ${value} из 5`"
            @click="confidence = confidence === value ? null : value"
          >
            {{ value }}
          </button>
        </div>
      </fieldset>

      <label class="field">
        <span>заметки</span>
        <textarea v-model="notes" rows="4" placeholder="Идея, на чём споткнулся, что повторить" />
      </label>

      <AppButton :loading="savingReflection" @click="save">сохранить разбор</AppButton>

      <details v-if="showHistory" class="history" @toggle="loadSolutions">
        <summary>прошлые решения</summary>

        <p v-if="loadingSolutions" class="muted">загрузка…</p>
        <p v-else-if="solutionsLoaded && solutions.length === 0" class="muted">
          принятых решений не нашлось
        </p>
        <template v-else-if="solutions.length > 0">
          <label class="field">
            <span>выбрать</span>
            <select v-model="selectedId">
              <option v-for="item in solutions" :key="item.id" :value="item.id">
                {{ formatFinishedAt(item.finishedAt) }} · {{ languageLabel(item.language) }}
              </option>
            </select>
          </label>
          <pre v-if="selectedSolution" class="code">{{ selectedSolution.sourceCode }}</pre>
        </template>
      </details>
    </div>
  </details>
</template>

<style scoped>
.reflection {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.reflection summary {
  font-size: var(--text-caption);
  color: var(--text-muted);
  cursor: pointer;
}

.body {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.field {
  display: grid;
  gap: var(--space-2);
  border: 0;
  padding: 0;
  font-size: var(--text-caption);
  color: var(--text-muted);
}

input,
select,
textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-input);
}

textarea {
  resize: vertical;
}

.scale {
  display: flex;
  gap: var(--space-2);
}

.dot {
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-muted);
  cursor: pointer;
  transition: background var(--motion-fast) var(--ease);
}

.dot--on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.history {
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
}

.history summary {
  font-size: var(--text-caption);
  color: var(--text-muted);
  cursor: pointer;
}

.history .field {
  margin-top: var(--space-3);
}

.muted {
  margin-top: var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.code {
  overflow: auto;
  margin-top: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  white-space: pre-wrap;
}
</style>

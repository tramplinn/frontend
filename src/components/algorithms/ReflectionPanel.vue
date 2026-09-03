<script setup lang="ts">
import { ref, watch } from 'vue'

import type { AlgorithmProgress } from '@/api/schemas/algorithms'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ progress: AlgorithmProgress | null; saving: boolean }>()

const emit = defineEmits<{
  save: [
    draft: { complexityMd: string | null; confidence: number | null; reflectionMd: string | null },
  ]
}>()

const complexity = ref('')
const confidence = ref<number | null>(null)
const notes = ref('')

// Разбор задачи пишется после решения, поэтому подтягиваем то, что уже сохранено.
watch(
  () => props.progress,
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

      <AppButton :loading="props.saving" @click="save">сохранить разбор</AppButton>
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
</style>

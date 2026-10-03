<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import type { useProblemRunner } from '@/features/algorithms/composables/useProblemRunner'
import { translate, useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ runner: ReturnType<typeof useProblemRunner> }>()

const emit = defineEmits<{
  save: [
    draft: { complexityMd: string | null; confidence: number | null; reflectionMd: string | null },
  ]
}>()

const { progress, savingReflection } = props.runner

const complexity = ref('')
const confidence = ref<number | null>(null)
const notes = ref('')

type Progress = typeof progress.value

function editedSince(saved: Progress): boolean {
  return (
    complexity.value !== (saved?.complexityMd ?? '') ||
    confidence.value !== (saved?.confidence ?? null) ||
    notes.value !== (saved?.reflectionMd ?? '')
  )
}

// Разбор задачи пишется после решения, поэтому подтягиваем то, что уже сохранено.
// Прогресс обновляется и после каждой отправки решения — несохранённые заметки
// при этом не трогаем, иначе они пропадали бы по нажатию «отправить».
watch(
  progress,
  (value, previous) => {
    if (previous !== undefined && editedSince(previous)) return
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

const dirty = computed(() => editedSince(progress.value))
useUnsavedChangesGuard(dirty, () => translate('unsaved.reflection'))
</script>

<template>
  <details class="reflection">
    <summary>{{ t('reflection.title') }}</summary>

    <div class="body">
      <label class="field">
        <span>{{ t('reflection.complexity') }}</span>
        <input
          v-model="complexity"
          type="text"
          class="form-field"
          :placeholder="t('reflection.complexityPlaceholder')"
        />
      </label>

      <fieldset class="field">
        <legend>{{ t('reflection.confidence') }}</legend>
        <div class="scale">
          <button
            v-for="value in [1, 2, 3, 4, 5]"
            :key="value"
            type="button"
            class="dot"
            :class="{ 'dot--on': confidence !== null && value <= confidence }"
            :aria-pressed="confidence === value"
            :aria-label="t('reflection.confidenceValue', { value })"
            @click="confidence = confidence === value ? null : value"
          >
            {{ value }}
          </button>
        </div>
      </fieldset>

      <label class="field">
        <span>{{ t('reflection.notes') }}</span>
        <textarea
          v-model="notes"
          rows="4"
          class="form-field"
          :placeholder="t('reflection.notesPlaceholder')"
        />
      </label>

      <AppButton :loading="savingReflection" @click="save">{{ t('reflection.save') }}</AppButton>
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

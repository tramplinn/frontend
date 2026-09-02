<script setup lang="ts">
import { Label, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { computed, ref } from 'vue'

import type { QuizQuestion } from '@/api/schemas/content'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { normalizeOptions } from './options'

const props = defineProps<{ question: QuizQuestion; reviewing: boolean }>()
const emit = defineEmits<{ answer: [value: unknown] }>()

const selected = ref<string[]>([])
const options = computed(() => normalizeOptions(props.question.options))

function selectSingle(value: unknown): void {
  const key = typeof value === 'string' ? value : ''
  selected.value = key ? [key] : []
  const option = options.value.find((item) => item.key === key)
  if (option) emit('answer', option.value)
}

function toggleMultiple(key: string, checked: boolean): void {
  selected.value = checked
    ? [...selected.value, key]
    : selected.value.filter((item) => item !== key)
  emit(
    'answer',
    options.value.filter((item) => selected.value.includes(item.key)).map((item) => item.value),
  )
}
</script>

<template>
  <RadioGroupRoot
    v-if="question.type === 'single'"
    :model-value="selected[0] ?? ''"
    class="options"
    :disabled="reviewing"
    @update:model-value="selectSingle"
  >
    <div v-for="option in options" :key="option.key" class="option">
      <RadioGroupItem :id="`${question.id}-${option.key}`" :value="option.key" class="radio">
        <span class="radio-dot" />
      </RadioGroupItem>
      <Label :for="`${question.id}-${option.key}`" class="option-label">
        {{ option.label }}
      </Label>
    </div>
  </RadioGroupRoot>

  <div v-else class="options">
    <div v-for="option in options" :key="option.key" class="option">
      <AppCheckbox
        :id="`${question.id}-${option.key}`"
        :model-value="selected.includes(option.key)"
        :disabled="reviewing"
        @update:model-value="(checked) => toggleMultiple(option.key, checked)"
      />
      <Label :for="`${question.id}-${option.key}`" class="option-label">
        {{ option.label }}
      </Label>
    </div>
  </div>
</template>

<style scoped>
.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: var(--space-8);
}

.option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.radio {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-4);
  height: var(--space-4);
  padding: 0;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
  cursor: pointer;
}

.radio[data-state='checked'] {
  border-color: var(--accent);
  background: var(--accent);
}

.radio-dot {
  width: var(--space-1);
  height: var(--space-1);
  border-radius: var(--radius-pill);
  background: var(--on-accent);
  opacity: 0;
}

.radio[data-state='checked'] .radio-dot {
  opacity: 1;
}

.option-label {
  cursor: pointer;
}

@media (max-width: 620px) {
  .options {
    padding-left: 0;
  }
}
</style>

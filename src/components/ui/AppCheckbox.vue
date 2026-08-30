<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

/** id обязателен: чекбокс — это button, и подпись связывается с ним только
    через Label for, иначе клик по тексту ничего не переключает. */
const props = withDefaults(defineProps<{ modelValue: boolean; id: string; disabled?: boolean }>(), {
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function update(value: unknown): void {
  emit('update:modelValue', value === true)
}
</script>

<template>
  <CheckboxRoot
    :id="props.id"
    :model-value="props.modelValue"
    :disabled="props.disabled"
    class="box"
    @update:model-value="update"
  >
    <CheckboxIndicator class="mark">✓</CheckboxIndicator>
  </CheckboxRoot>
</template>

<style scoped>
.box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-4);
  height: var(--space-4);
  padding: 0;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--card);
  cursor: pointer;
}

.box[data-state='checked'] {
  background: var(--accent);
  border-color: var(--accent);
}

.box:disabled {
  opacity: 0.5;
  cursor: default;
}

.mark {
  display: flex;
  line-height: 1;
  color: var(--on-accent);
  font-size: var(--text-micro);
}
</style>

<script setup lang="ts" generic="T extends string">
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { computed } from 'vue'

interface Option {
  value: T
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: Option[]
    label: string
    /** Текст триггера, пока modelValue не совпадает ни с одной опцией. */
    placeholder?: string | null
    disabled?: boolean
  }>(),
  { disabled: false, placeholder: null },
)

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const currentLabel = computed(
  () =>
    props.options.find((item) => item.value === props.modelValue)?.label ?? props.placeholder ?? '',
)

function update(value: unknown): void {
  const option = props.options.find((item) => item.value === value)
  if (option) {
    emit('update:modelValue', option.value)
  }
}
</script>

<template>
  <SelectRoot
    :model-value="props.modelValue"
    :disabled="props.disabled"
    @update:model-value="update"
  >
    <SelectTrigger class="trigger" :aria-label="props.label">
      <SelectValue class="value" :placeholder="props.placeholder ?? ''">{{
        currentLabel
      }}</SelectValue>
      <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" class="caret">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" />
      </svg>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent class="app-select-surface" position="popper" :side-offset="4">
        <SelectViewport>
          <SelectItem
            v-for="option in props.options"
            :key="option.value"
            :value="option.value"
            class="app-select-item"
          >
            <SelectItemIndicator class="app-select-check">✓</SelectItemIndicator>
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped>
.trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.trigger:hover:not(:disabled) {
  background: var(--surface);
}

.trigger[data-state='open'] {
  border-color: var(--accent);
}

.trigger:disabled {
  opacity: 0.5;
  cursor: default;
}

.value[data-placeholder] {
  color: var(--text-muted);
}

.caret {
  color: var(--text-muted);
}
</style>

<!-- Список уходит в портал на body и теряет scope-идентификатор, поэтому
     стилизуется глобально; имена классов уникальны. -->
<style>
.app-select-surface {
  min-width: var(--reka-select-trigger-width);
  padding: var(--space-2);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  box-shadow: var(--shadow-raised);
  z-index: 20;
}

.app-select-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  cursor: pointer;
  outline: none;
}

.app-select-item[data-highlighted] {
  background: var(--surface);
}

.app-select-item[data-state='checked'] {
  font-weight: var(--weight-medium);
}

.app-select-check {
  width: var(--space-3);
  color: var(--accent);
  font-size: var(--text-micro);
  line-height: 1;
}
</style>

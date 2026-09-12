<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    suggestions?: string[]
    placeholder?: string
  }>(),
  { suggestions: () => [], placeholder: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const activeIndex = ref(-1)
const listboxId = useId()

const options = computed(() => {
  const query = props.modelValue.trim().toLowerCase()
  return props.suggestions
    .filter((name) => name.toLowerCase() !== query)
    .filter((name) => !query || name.toLowerCase().includes(query))
    .slice(0, 8)
})

watch(options, () => {
  activeIndex.value = -1
})

function pick(name: string): void {
  emit('update:modelValue', name)
  open.value = false
  activeIndex.value = -1
}

function moveActive(delta: number): void {
  if (options.value.length === 0) return
  const count = options.value.length
  const base = activeIndex.value < 0 ? (delta > 0 ? -1 : 0) : activeIndex.value
  activeIndex.value = (base + delta + count) % count
  open.value = true
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
  } else if (event.key === 'Enter') {
    const name = options.value[activeIndex.value]
    if (name !== undefined) {
      event.preventDefault()
      pick(name)
    }
  } else if (event.key === 'Escape') {
    open.value = false
    activeIndex.value = -1
  }
}
</script>

<template>
  <div class="combo">
    <input
      :value="modelValue"
      type="text"
      role="combobox"
      class="text-field input"
      :placeholder="placeholder"
      aria-autocomplete="list"
      :aria-expanded="open && options.length > 0"
      :aria-controls="listboxId"
      :aria-activedescendant="activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onKeydown"
      @focus="open = true"
      @blur="open = false"
    />
    <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" class="caret">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" />
    </svg>
    <ul v-if="open && options.length > 0" :id="listboxId" class="suggestions" role="listbox">
      <li
        v-for="(name, index) in options"
        :id="`${listboxId}-opt-${index}`"
        :key="name"
        role="option"
        :aria-selected="index === activeIndex"
      >
        <button
          type="button"
          :class="{ active: index === activeIndex }"
          @mousedown.prevent="pick(name)"
          @mouseenter="activeIndex = index"
        >
          {{ name }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.combo {
  position: relative;
}

.input {
  width: 100%;
  padding-right: var(--space-8);
}

.caret {
  position: absolute;
  top: 50%;
  right: var(--space-3);
  color: var(--text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.suggestions {
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  padding: var(--space-2);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  box-shadow: var(--shadow-raised);
  list-style: none;
}

.suggestions button {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  color: var(--text);
  cursor: pointer;
}

.suggestions button:hover,
.suggestions button.active {
  background: var(--surface);
}
</style>

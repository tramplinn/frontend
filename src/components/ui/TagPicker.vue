<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    suggestions?: string[]
    placeholder?: string
  }>(),
  { suggestions: () => [], placeholder: 'добавить тег' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const draft = ref('')
const open = ref(false)

const options = computed(() => {
  const query = draft.value.trim().toLowerCase()
  const chosen = new Set(props.modelValue.map((name) => name.toLowerCase()))
  return props.suggestions
    .filter((name) => !chosen.has(name.toLowerCase()))
    .filter((name) => !query || name.toLowerCase().includes(query))
    .slice(0, 8)
})

function has(name: string): boolean {
  const key = name.toLowerCase()
  return props.modelValue.some((item) => item.toLowerCase() === key)
}

function add(name: string): void {
  const value = name.trim()
  if (!value || has(value)) return
  emit('update:modelValue', [...props.modelValue, value])
}

function remove(name: string): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((item) => item !== name),
  )
}

function commitDraft(): void {
  if (draft.value.trim()) add(draft.value)
  draft.value = ''
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commitDraft()
  } else if (event.key === 'Backspace' && !draft.value && props.modelValue.length > 0) {
    const last = props.modelValue.at(-1)
    if (last !== undefined) remove(last)
  }
}

function pick(name: string): void {
  add(name)
  draft.value = ''
  open.value = false
}
</script>

<template>
  <div class="picker">
    <ul class="chips">
      <li v-for="name in modelValue" :key="name" class="chip">
        <span>{{ name }}</span>
        <button
          type="button"
          class="remove"
          :aria-label="`убрать тег ${name}`"
          @click="remove(name)"
        >
          ×
        </button>
      </li>
      <li class="input-cell">
        <input
          v-model="draft"
          type="text"
          :placeholder="modelValue.length === 0 ? placeholder : ''"
          @keydown="onKeydown"
          @focus="open = true"
          @blur="
            () => {
              commitDraft()
              open = false
            }
          "
        />
      </li>
    </ul>
    <ul v-if="open && options.length > 0" class="suggestions" role="listbox">
      <li v-for="name in options" :key="name">
        <button type="button" @mousedown.prevent="pick(name)">{{ name }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--ctl-sm);
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0 var(--space-2);
  height: calc(var(--ctl-sm) - 8px);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: var(--text-caption);
  color: var(--text);
}

.remove {
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  font-size: var(--text-caption);
  line-height: 1;
}

.remove:hover {
  color: var(--text);
}

.input-cell {
  flex: 1;
  min-width: 8ch;
}

.input-cell input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-caption);
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

.suggestions button:hover {
  background: var(--surface);
}
</style>

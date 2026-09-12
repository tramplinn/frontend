<script setup lang="ts">
import { computed, ref } from 'vue'

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

const options = computed(() => {
  const query = props.modelValue.trim().toLowerCase()
  return props.suggestions
    .filter((name) => name.toLowerCase() !== query)
    .filter((name) => !query || name.toLowerCase().includes(query))
    .slice(0, 8)
})

function pick(name: string): void {
  emit('update:modelValue', name)
  open.value = false
}
</script>

<template>
  <div class="combo">
    <input
      :value="modelValue"
      type="text"
      class="text-field"
      :placeholder="placeholder"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="open = true"
      @blur="open = false"
    />
    <ul v-if="open && options.length > 0" class="suggestions" role="listbox">
      <li v-for="name in options" :key="name">
        <button type="button" @mousedown.prevent="pick(name)">{{ name }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.combo {
  position: relative;
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

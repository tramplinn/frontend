<script setup lang="ts">
defineProps<{ pressed: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" class="chip" :aria-pressed="pressed" @click="$emit('click')">
    <slot />
  </button>
</template>

<style scoped>
.chip {
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.chip:hover {
  color: var(--text);
}

.chip[aria-pressed='true'] {
  background: var(--selected);
  color: var(--on-selected);
}
</style>

<script setup lang="ts">
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import { DIFFICULTY_LABELS } from '@/lib/algorithms'

const props = defineProps<{ difficulty: AlgorithmDifficulty }>()
</script>

<template>
  <span class="chip" :class="`chip--${props.difficulty}`">
    {{ DIFFICULTY_LABELS[props.difficulty] }}
  </span>
</template>

<style scoped>
.chip {
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}

.chip--easy {
  background: var(--success-soft);
  color: var(--success);
}

.chip--medium {
  background: var(--warning-soft);
  color: var(--warning);
}

.chip--hard {
  background: var(--danger-soft);
  color: var(--danger);
}
</style>

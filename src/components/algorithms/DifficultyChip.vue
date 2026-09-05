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

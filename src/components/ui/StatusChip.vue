<script setup lang="ts">
import type { ContentStatus } from '@/api/schemas/common'

const props = defineProps<{ status: ContentStatus }>()
</script>

<template>
  <span class="chip" :class="`chip--${props.status}`">
    {{ props.status === 'published' ? 'опубликован' : 'черновик' }}
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

.chip--published {
  background: var(--success-soft);
  color: var(--success);
}

.chip--draft {
  background: var(--warning-soft);
  color: var(--warning);
}
</style>

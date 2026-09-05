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
.chip--published {
  background: var(--success-soft);
  color: var(--success);
}

.chip--draft {
  background: var(--warning-soft);
  color: var(--warning);
}
</style>

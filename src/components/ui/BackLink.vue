<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ to: RouteLocationRaw }>()
</script>

<template>
  <RouterLink :to="to" class="back-link">
    <span aria-hidden="true">←</span>
    <slot />
  </RouterLink>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
  transition: color var(--motion-fast) var(--ease);
}

.back-link:hover {
  color: var(--text);
}
</style>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ to: RouteLocationRaw; title: string; topics: string[] }>()
</script>

<template>
  <RouterLink :to="to" class="row">
    <span class="title">{{ title }}</span>
    <span class="meta">
      <slot />
      <span v-for="topic in topics.slice(0, 2)" :key="topic" class="topic">{{ topic }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.row {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  color: inherit;
  text-decoration: none;
  transition: background var(--motion-fast) var(--ease);
}

.row:hover {
  background: var(--card-hover);
}

.title {
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
}
</style>

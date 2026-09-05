<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import type { Tag } from '@/api/schemas/tags'

defineProps<{ to: RouteLocationRaw; title: string; tags: Tag[] }>()
</script>

<template>
  <RouterLink :to="to" class="row">
    <span class="title">{{ title }}</span>
    <span class="meta">
      <slot />
      <span v-for="tag in tags.slice(0, 2)" :key="tag.id" class="topic">{{ tag.name }}</span>
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

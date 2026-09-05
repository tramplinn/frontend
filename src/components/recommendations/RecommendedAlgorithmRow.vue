<script setup lang="ts">
import type { RecommendedAlgorithm } from '@/api/schemas/recommendations'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'

defineProps<{ item: RecommendedAlgorithm }>()
</script>

<template>
  <RouterLink :to="{ name: 'algorithm-solo', params: { problem: item.id } }" class="row">
    <span class="title">{{ item.title }}</span>
    <span class="meta">
      <DifficultyChip :difficulty="item.difficulty" />
      <span v-for="topic in item.topics.slice(0, 2)" :key="topic" class="topic">{{ topic }}</span>
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

.topic {
  padding: 1px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--text-micro);
}
</style>

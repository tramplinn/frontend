<script setup lang="ts">
import type { RecommendedCourse } from '@/api/schemas/recommendations'
import { withCount } from '@/lib/plural'

const props = defineProps<{ item: RecommendedCourse }>()

function hours(value: number | null): string {
  return value === null ? '' : withCount(value, 'час', 'часа', 'часов')
}
</script>

<template>
  <RouterLink :to="{ name: 'course', params: { course: item.slug } }" class="row">
    <span class="title">{{ item.title }}</span>
    <span class="meta">
      <span v-if="props.item.estHours !== null" class="hours">{{
        hours(props.item.estHours)
      }}</span>
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

.hours {
  color: var(--text-muted);
  font-size: var(--text-micro);
}

.topic {
  padding: 1px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--text-micro);
}
</style>

<script setup lang="ts" generic="T extends { id: string; title: string }">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  items: T[]
  to: (item: T) => RouteLocationRaw
}>()
</script>

<template>
  <ul class="list">
    <li v-for="item in items" :key="item.id" class="item">
      <RouterLink class="item-link" :to="to(item)">
        <span class="item-title" :title="item.title">{{ item.title }}</span>
        <span v-if="$slots.badges" class="item-badges"><slot name="badges" :item="item" /></span>
        <span v-if="$slots.meta" class="item-meta"><slot name="meta" :item="item" /></span>
      </RouterLink>
      <slot name="actions" :item="item" />
    </li>
  </ul>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  border-radius: var(--radius-ctl);
  transition: background var(--motion-fast) var(--ease);
}

.item:hover {
  background: var(--surface);
}

.item-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-caption);
}

.item-title {
  min-width: 0;
  overflow: hidden;
  font-weight: var(--weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-badges,
.item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.item-badges {
  flex-shrink: 0;
}

.item-meta {
  margin-left: auto;
  color: var(--text-muted);
}

@media (max-width: 620px) {
  .item {
    align-items: flex-start;
  }

  .item-link {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .item-title {
    width: 100%;
    white-space: normal;
  }

  .item-meta {
    width: 100%;
    margin-left: 0;
  }
}
</style>

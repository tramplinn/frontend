<script setup lang="ts">
import type { ProjectStatus } from '@/api/schemas/projects'
import { statusLabel } from '@/lib/projects'

defineProps<{ status: ProjectStatus }>()
</script>

<template>
  <span class="chip" :class="`chip--${status}`">{{ statusLabel(status) }}</span>
</template>

<style scoped>
/* Цвета статусов общие для бейджа и чипов фильтра каталога. */
.chip--idea {
  background: var(--icon-purple-soft);
  color: var(--icon-purple);
}
.chip--planning {
  background: var(--icon-cyan-soft);
  color: var(--icon-cyan);
}
.chip--in_progress {
  background: var(--accent-soft);
  color: var(--accent);
}
.chip--paused {
  background: var(--warning-soft);
  color: var(--warning);
}
.chip--done {
  background: var(--success-soft);
  color: var(--success);
}
.chip--archived {
  background: var(--surface);
  color: var(--text-muted);
}
</style>

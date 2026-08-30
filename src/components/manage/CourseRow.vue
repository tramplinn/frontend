<script setup lang="ts">
import type { Course } from '@/api/schemas/content'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { contentStatusAction } from '@/features/content/model/contentTree'

const props = defineProps<{
  course: Course
  busy: boolean
  open: boolean
  first: boolean
  last: boolean
}>()

const emit = defineEmits<{
  toggle: []
  publish: []
  move: [delta: number]
  detach: []
  remove: []
}>()
</script>

<template>
  <div class="course-row">
    <button type="button" class="course" :aria-expanded="props.open" @click="emit('toggle')">
      <span class="caret">{{ props.open ? '−' : '+' }}</span>
      <span class="course-title">{{ props.course.title }}</span>
      <StatusChip :status="props.course.status" />
    </button>

    <RowMenu :disabled="props.busy" :label="`Действия: ${props.course.title}`">
      <RowMenuItem @select="emit('publish')">
        {{ contentStatusAction(props.course.status) }}
      </RowMenuItem>
      <RowMenuItem :disabled="props.first" @select="emit('move', -1)">выше в треке</RowMenuItem>
      <RowMenuItem :disabled="props.last" @select="emit('move', 1)">ниже в треке</RowMenuItem>
      <RowMenuItem @select="emit('detach')">убрать из трека</RowMenuItem>
      <RowMenuItem danger @select="emit('remove')">удалить курс</RowMenuItem>
    </RowMenu>
  </div>
</template>

<style scoped>
.course-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-ctl);
  transition: background var(--motion-fast) var(--ease);
}

.course-row:hover {
  background: var(--surface);
}

.course {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  padding: var(--space-3);
  border: none;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-body);
  text-align: left;
  cursor: pointer;
}

.caret {
  width: var(--space-3);
  color: var(--text-muted);
}

.course-title {
  font-weight: var(--weight-medium);
}
</style>

<script setup lang="ts">
import type { Course } from '@/api/schemas/content'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { contentStatusAction } from '@/features/content/model/contentTree'

const props = withDefaults(
  defineProps<{
    course: Course
    busy: boolean
    open: boolean
    first?: boolean
    last?: boolean
    /** Курс без трека: пункты меню про порядок и «убрать из трека» тут бессмысленны. */
    standalone?: boolean
    /** Показывается только в плоском списке курсов — из какого(их) трека(ов) курс. */
    trackTitles?: string[]
  }>(),
  { first: true, last: true, standalone: false, trackTitles: () => [] },
)

const emit = defineEmits<{
  toggle: []
  publish: []
  publishCascade: []
  move: [delta: number]
  edit: []
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
      <span v-if="props.standalone" class="track-titles">
        {{ props.trackTitles.length > 0 ? props.trackTitles.join(', ') : 'без трека' }}
      </span>
    </button>

    <RowMenu :disabled="props.busy" :label="`Действия: ${props.course.title}`">
      <RowMenuItem @select="emit('publish')">
        {{ contentStatusAction(props.course.status) }}
      </RowMenuItem>
      <RowMenuItem @select="emit('publishCascade')">опубликовать всё содержимое</RowMenuItem>
      <RowMenuItem @select="emit('edit')">изменить курс</RowMenuItem>
      <template v-if="!props.standalone">
        <RowMenuItem :disabled="props.first" @select="emit('move', -1)">выше в треке</RowMenuItem>
        <RowMenuItem :disabled="props.last" @select="emit('move', 1)">ниже в треке</RowMenuItem>
        <RowMenuItem @select="emit('detach')">убрать из трека</RowMenuItem>
      </template>
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

.track-titles {
  color: var(--text-muted);
  font-size: var(--text-caption);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

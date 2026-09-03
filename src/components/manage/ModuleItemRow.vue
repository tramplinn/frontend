<script setup lang="ts">
import { computed } from 'vue'

import type { ModuleItem } from '@/api/schemas/content'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { withCount } from '@/lib/plural'

const props = defineProps<{
  item: ModuleItem
  busy: boolean
  first: boolean
  last: boolean
}>()

const emit = defineEmits<{ move: [delta: number]; remove: [] }>()

const content = computed(() =>
  props.item.kind === 'lesson'
    ? props.item.lesson
    : props.item.kind === 'quiz'
      ? props.item.quiz
      : props.item.practiceSet,
)

const target = computed(() =>
  props.item.kind === 'lesson'
    ? { name: 'manage-lesson', params: { lesson: props.item.lesson.id } }
    : props.item.kind === 'quiz'
      ? { name: 'manage-quiz', params: { quiz: props.item.quiz.id } }
      : { name: 'manage-practice-set', params: { set: props.item.practiceSet.id } },
)

const removeLabel = computed(() =>
  props.item.kind === 'lesson'
    ? 'удалить урок'
    : props.item.kind === 'quiz'
      ? 'удалить тест'
      : 'удалить практику',
)
</script>

<template>
  <li class="item">
    <RouterLink class="item-link" :to="target">
      <span class="item-title">{{ content.title }}</span>
      <StatusChip :status="content.status" />
      <span v-if="props.item.kind === 'quiz'" class="item-meta">
        тест · {{ withCount(props.item.quiz.questions.length, 'вопрос', 'вопроса', 'вопросов') }}
      </span>
      <span v-else-if="props.item.kind === 'practice'" class="item-meta">
        {{ props.item.practiceSet.mode === 'mock_interview' ? 'интервью' : 'практика' }}
      </span>
    </RouterLink>

    <RowMenu :disabled="props.busy" :label="`Действия: ${content.title}`">
      <RowMenuItem :disabled="props.first" @select="emit('move', -1)">выше</RowMenuItem>
      <RowMenuItem :disabled="props.last" @select="emit('move', 1)">ниже</RowMenuItem>
      <RowMenuItem danger @select="emit('remove')">{{ removeLabel }}</RowMenuItem>
    </RowMenu>
  </li>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

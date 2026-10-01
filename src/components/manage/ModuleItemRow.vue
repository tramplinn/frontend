<script setup lang="ts">
import { computed } from 'vue'

import type { ModuleItem } from '@/api/schemas/content'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { contentStatusAction } from '@/features/content/model/contentTree'
import { useI18n } from '@/i18n'

const props = defineProps<{
  item: ModuleItem
  busy: boolean
  first: boolean
  last: boolean
}>()

const emit = defineEmits<{ move: [delta: number]; publish: []; remove: [] }>()

const { t, tc } = useI18n()

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
    ? t('content.deleteLesson')
    : props.item.kind === 'quiz'
      ? t('content.deleteQuiz')
      : t('content.deletePractice'),
)
</script>

<template>
  <li class="item">
    <RouterLink class="item-link" :to="target">
      <span class="item-title">{{ content.title }}</span>
      <StatusChip :status="content.status" />
      <span v-if="props.item.kind === 'quiz'" class="item-meta">
        {{ t('course.quiz') }} · {{ tc('units.questions', props.item.quiz.questions.length) }}
      </span>
      <span v-else-if="props.item.kind === 'practice'" class="item-meta">
        {{
          props.item.practiceSet.mode === 'mock_interview'
            ? t('course.interview')
            : t('course.practice')
        }}
      </span>
    </RouterLink>

    <RowMenu :disabled="props.busy" :label="t('manage.actionsFor', { title: content.title })">
      <RowMenuItem @select="emit('publish')">{{ contentStatusAction(content.status) }}</RowMenuItem>
      <RowMenuItem :disabled="props.first" @select="emit('move', -1)">{{
        t('manage.up')
      }}</RowMenuItem>
      <RowMenuItem :disabled="props.last" @select="emit('move', 1)">{{
        t('manage.down')
      }}</RowMenuItem>
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

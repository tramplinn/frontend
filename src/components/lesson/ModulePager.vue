<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { ModuleTree } from '@/api/schemas/content'
import { useProgressStore } from '@/stores/progress'
import { useI18n } from '@/i18n'

const { t } = useI18n()

interface FlowItem {
  kind: 'lesson' | 'quiz' | 'practice'
  id: string
  slug: string
  title: string
}

const props = defineProps<{
  course: string
  module: ModuleTree
  currentId: string
}>()

const progress = useProgressStore()

onMounted(() => {
  void progress.load().catch(() => {})
})

const flow = computed<FlowItem[]>(() =>
  props.module.items.map((item) => {
    if (item.kind === 'lesson') {
      return {
        kind: item.kind,
        id: item.lesson.id,
        slug: item.lesson.slug,
        title: item.lesson.title,
      }
    }
    if (item.kind === 'quiz') {
      return { kind: item.kind, id: item.quiz.id, slug: item.quiz.slug, title: item.quiz.title }
    }
    return {
      kind: item.kind,
      id: item.practiceSet.id,
      slug: item.practiceSet.id,
      title: item.practiceSet.title,
    }
  }),
)
const siblings = computed(() => {
  const index = flow.value.findIndex((item) => item.id === props.currentId)
  return index < 0
    ? { previous: null, next: null }
    : { previous: flow.value[index - 1] ?? null, next: flow.value[index + 1] ?? null }
})

function isDone(item: FlowItem): boolean {
  return item.kind === 'lesson'
    ? progress.isCompleted(item.id)
    : item.kind === 'quiz'
      ? progress.isQuizPassed(item.id)
      : false
}

const done = computed(() => flow.value.filter(isDone).length)

function target(item: FlowItem): RouteLocationRaw {
  const params = { course: props.course, module: props.module.slug }
  return item.kind === 'lesson'
    ? { name: 'lesson', params: { ...params, lesson: item.slug } }
    : item.kind === 'quiz'
      ? { name: 'quiz', params: { ...params, quiz: item.slug } }
      : { name: 'algorithm-practice', params: { ...params, set: item.id } }
}

function label(item: FlowItem, direction: 'previous' | 'next'): string {
  if (item.kind === 'quiz') {
    return direction === 'next' ? t('pager.toQuiz') : t('pager.backToQuiz')
  }
  if (item.kind === 'practice') return t('pager.toPractice')
  return direction === 'next' ? t('pager.nextLesson') : t('pager.previousLesson')
}
</script>

<template>
  <nav class="pager" :aria-label="t('pager.label')">
    <RouterLink
      v-if="siblings.previous"
      class="side"
      :to="target(siblings.previous)"
      :title="siblings.previous.title"
    >
      <span class="arrow" aria-hidden="true">←</span>
      <span class="side-label">{{ label(siblings.previous, 'previous') }}</span>
    </RouterLink>
    <span v-else class="side side--empty" aria-hidden="true"></span>

    <ol class="dots" :aria-label="t('pager.done', { done, total: flow.length })">
      <li v-for="item in flow" :key="item.id">
        <RouterLink
          class="dot"
          :class="{
            'dot--done': isDone(item),
            'dot--current': item.id === props.currentId,
            'dot--quiz': item.kind === 'quiz',
          }"
          :to="target(item)"
          :title="item.kind === 'quiz' ? t('pager.quizTitle', { title: item.title }) : item.title"
          :aria-current="item.id === props.currentId ? 'page' : undefined"
        >
          <span class="visually-hidden">
            {{ item.kind === 'quiz' ? t('pager.quizTitle', { title: item.title }) : item.title }}
          </span>
        </RouterLink>
      </li>
    </ol>

    <RouterLink
      v-if="siblings.next"
      class="side side--next"
      :to="target(siblings.next)"
      :title="siblings.next.title"
    >
      <span class="side-label">{{ label(siblings.next, 'next') }}</span>
      <span class="arrow" aria-hidden="true">→</span>
    </RouterLink>
    <span v-else class="side side--empty" aria-hidden="true"></span>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.side {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1 1 0;
  min-width: 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
  transition: color var(--motion-fast) var(--ease);
}

.side:hover {
  color: var(--text);
}

.side--next {
  justify-content: flex-end;
}

.side--empty {
  pointer-events: none;
}

.side-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  flex-shrink: 0;
}

.dots {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  list-style: none;
}

.dot {
  display: block;
  width: var(--space-2);
  height: var(--space-2);
  border: 1.5px solid var(--text-muted);
  border-radius: var(--radius-pill);
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.dot:hover {
  border-color: var(--text);
}

.dot--done {
  background: var(--accent);
  border-color: var(--accent);
}

.dot--quiz {
  border-radius: var(--radius-xs);
}

.dot--current {
  transform: scale(1.5);
  border-color: var(--text);
}

.dot--current.dot--done {
  border-color: var(--accent);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ModuleTree } from '@/api/schemas/content'
import type { ModuleProgress } from '@/api/schemas/learning'
import { useI18n } from '@/i18n'
import type { GraphLayout, GraphNode } from './graph'
import { NODE_HEIGHT, NODE_WIDTH, neighbourhood } from './graph'

const props = defineProps<{
  layout: GraphLayout
  modules: ModuleTree[]
  progress: ModuleProgress[]
  selected: string | null
}>()

const emit = defineEmits<{ select: [moduleId: string]; focusNode: [node: GraphNode] }>()

const { tc } = useI18n()

const hovered = ref<string | null>(null)

const moduleById = computed(() => new Map(props.modules.map((module) => [module.id, module])))
const progressById = computed(() => new Map(props.progress.map((item) => [item.moduleId, item])))

const related = computed(() =>
  hovered.value === null ? null : neighbourhood(props.layout.edges, hovered.value),
)

const activeEdges = computed(() =>
  hovered.value === null
    ? []
    : props.layout.edges.filter((edge) => edge.from === hovered.value || edge.to === hovered.value),
)

function focusNode(node: GraphNode): void {
  hovered.value = node.id
  emit('focusNode', node)
}

function isDimmed(id: string): boolean {
  return related.value !== null && !related.value.has(id)
}

function counts(id: string): string {
  const module = moduleById.value.get(id)
  if (!module) {
    return ''
  }
  const lessons = module.items.filter((item) => item.kind === 'lesson').length
  const quizzes = module.items.filter((item) => item.kind === 'quiz').length
  const parts = [tc('units.lessons', lessons)]
  if (quizzes > 0) {
    parts.push(tc('units.quizzes', quizzes))
  }
  return parts.join(' · ')
}

function ratio(id: string): number {
  const item = progressById.value.get(id)
  if (!item || item.totalLessons === 0) {
    return 0
  }
  return item.completedLessons / item.totalLessons
}

function isDone(id: string): boolean {
  return ratio(id) === 1
}
</script>

<template>
  <div
    v-if="props.layout.nodes.length > 0"
    class="canvas"
    :style="{
      width: `${String(props.layout.width)}px`,
      height: `${String(props.layout.height)}px`,
    }"
    @mouseleave="hovered = null"
  >
    <svg
      class="edges"
      :viewBox="`0 0 ${String(props.layout.width)} ${String(props.layout.height)}`"
      aria-hidden="true"
    >
      <path
        v-for="edge in props.layout.edges"
        :key="`${edge.from}-${edge.to}`"
        :d="edge.path"
        class="edge"
        :class="{ 'edge--dim': related !== null }"
      />
    </svg>

    <button
      v-for="node in props.layout.nodes"
      :key="node.id"
      type="button"
      class="node"
      :class="{
        'node--selected': node.id === props.selected,
        'node--done': isDone(node.id),
        'node--dim': isDimmed(node.id),
      }"
      :style="{
        left: `${String(node.x)}px`,
        top: `${String(node.y)}px`,
        width: `${String(NODE_WIDTH)}px`,
        minHeight: `${String(NODE_HEIGHT)}px`,
      }"
      :aria-pressed="node.id === props.selected"
      @mouseenter="hovered = node.id"
      @focus="focusNode(node)"
      @blur="hovered = null"
      @click="emit('select', node.id)"
    >
      <span class="node-title">{{ node.title }}</span>
      <span class="node-meta">{{ counts(node.id) }}</span>
      <span v-if="ratio(node.id) > 0" class="node-bar" aria-hidden="true">
        <span class="node-bar-fill" :style="{ width: `${String(ratio(node.id) * 100)}%` }" />
      </span>
    </button>

    <!-- Подсвеченные связи рисуются поверх узлов: иначе линия ныряет под
         соседнюю карточку и выглядит разорванной. -->
    <svg
      v-if="related !== null"
      class="edges edges--top"
      :viewBox="`0 0 ${String(props.layout.width)} ${String(props.layout.height)}`"
      aria-hidden="true"
    >
      <path
        v-for="edge in activeEdges"
        :key="`${edge.from}-${edge.to}`"
        :d="edge.path"
        class="edge edge--active"
      />
    </svg>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  flex-shrink: 0;
}

.edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.edges--top {
  pointer-events: none;
}

.edge {
  fill: none;
  stroke: var(--border);
  stroke-width: 1.5;
  stroke-linecap: round;
  transition: opacity var(--motion-fast) var(--ease);
}

.edge--active {
  stroke: var(--accent);
  stroke-width: 2;
  opacity: 1;
}

.edge--dim {
  opacity: 0.4;
}

.node {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease),
    opacity var(--motion-fast) var(--ease);
}

.node:hover {
  background: var(--card-hover);
  border-color: var(--text-muted);
}

.node--selected {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.node--dim {
  opacity: 0.45;
}

.node-title {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: 1.3;
}

.node-meta {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.node-bar {
  display: block;
  height: 3px;
  margin-top: auto;
  border-radius: var(--radius-pill);
  background: var(--surface-hover);
  overflow: hidden;
}

.node-bar-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--accent);
}

.node--done .node-bar-fill {
  background: var(--success);
}
</style>

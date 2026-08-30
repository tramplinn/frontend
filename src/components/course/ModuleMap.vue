<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { ModuleDependency, ModuleTree } from '@/api/schemas/content'
import type { ModuleProgress } from '@/api/schemas/learning'
import { useProgressStore } from '@/stores/progress'
import ModuleGraphCanvas from './ModuleGraphCanvas.vue'
import type { GraphNode } from './graph'
import { NODE_HEIGHT, NODE_WIDTH, layoutGraph } from './graph'
import type { View } from './panZoom'
import { centerOn, fitView, panIntoView, zoomAt } from './panZoom'

const props = defineProps<{
  course: string
  modules: ModuleTree[]
  dependencies: ModuleDependency[]
  currentModuleId: string | null
}>()

const PADDING = 24
const STORAGE_KEY = 'tramplin:course-map'

const router = useRouter()
const progress = useProgressStore()

const expanded = ref(readExpanded())
const viewport = ref<HTMLElement | null>(null)
const size = ref({ width: 0, height: 0 })
const view = ref<View>({ x: 0, y: 0, scale: 1 })
const panning = ref(false)

const layout = computed(() => layoutGraph(props.modules, props.dependencies))

function readExpanded(): boolean {
  // Приватный режим и заблокированное хранилище кидают на самом доступе.
  try {
    return localStorage.getItem(STORAGE_KEY) === 'expanded'
  } catch {
    return false
  }
}

function toggle(): void {
  expanded.value = !expanded.value
  try {
    localStorage.setItem(STORAGE_KEY, expanded.value ? 'expanded' : 'collapsed')
  } catch {
    // Состояние просто не переживёт перезагрузку — падать из-за этого незачем.
  }
}

const moduleProgress = computed<ModuleProgress[]>(() =>
  props.modules.map((module) => {
    const lessons = module.items.filter((item) => item.kind === 'lesson')
    return {
      moduleId: module.id,
      totalLessons: lessons.length,
      completedLessons: lessons.filter((item) => progress.isCompleted(item.lesson.id)).length,
    }
  }),
)

function fit(): void {
  view.value = fitView(
    { width: layout.value.width, height: layout.value.height },
    size.value,
    PADDING,
  )
}

function showCurrent(): void {
  const node =
    layout.value.nodes.find((item) => item.id === props.currentModuleId) ?? layout.value.nodes[0]
  if (!node) {
    return
  }
  view.value = centerOn(
    { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEIGHT },
    size.value,
    1,
  )
}

function zoomBy(factor: number): void {
  view.value = zoomAt(view.value, factor, size.value.width / 2, size.value.height / 2)
}

function onWheel(event: WheelEvent): void {
  // Обычное колесо оставляем странице, иначе мимо доски не проскроллить.
  // Щипок на тачпаде приходит с ctrl.
  if (!event.ctrlKey && !event.metaKey) {
    return
  }
  event.preventDefault()
  const box = viewport.value?.getBoundingClientRect()
  if (!box) {
    return
  }
  view.value = zoomAt(
    view.value,
    Math.exp(-event.deltaY / 240),
    event.clientX - box.left,
    event.clientY - box.top,
  )
}

let origin = { x: 0, y: 0, viewX: 0, viewY: 0, pointerId: -1 }

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) {
    return
  }
  // За карточку модуля не тянем: это кнопка, и нажатие на ней — переход.
  if (event.target instanceof Element && event.target.closest('button')) {
    return
  }
  panning.value = true
  origin = {
    x: event.clientX,
    y: event.clientY,
    viewX: view.value.x,
    viewY: view.value.y,
    pointerId: event.pointerId,
  }
  viewport.value?.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onPointerMove(event: PointerEvent): void {
  if (!panning.value || event.pointerId !== origin.pointerId) {
    return
  }
  view.value = {
    scale: view.value.scale,
    x: origin.viewX + (event.clientX - origin.x),
    y: origin.viewY + (event.clientY - origin.y),
  }
}

function endPan(event: PointerEvent): void {
  // Именно panning: клик по карточке захвата не открывал, освобождать нечего.
  if (!panning.value || event.pointerId !== origin.pointerId) {
    return
  }
  panning.value = false
  origin.pointerId = -1
  viewport.value?.releasePointerCapture(event.pointerId)
}

function revealNode(node: GraphNode): void {
  view.value = panIntoView(
    view.value,
    { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEIGHT },
    size.value,
    PADDING,
  )
}

function openModule(moduleId: string): void {
  const module = props.modules.find((item) => item.id === moduleId)
  const first = module?.items[0]
  if (!module || !first) {
    void router.push({ name: 'course', params: { course: props.course } })
    return
  }
  const params = { course: props.course, module: module.slug }
  void router.push(
    first.kind === 'lesson'
      ? { name: 'lesson', params: { ...params, lesson: first.lesson.slug } }
      : { name: 'quiz', params: { ...params, quiz: first.quiz.slug } },
  )
}

let observer: ResizeObserver | undefined

watch(
  viewport,
  (element) => {
    observer?.disconnect()
    if (!element) {
      size.value = { width: 0, height: 0 }
      return
    }
    observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }
      const measured = entry.contentRect
      const first = size.value.width === 0
      size.value = { width: measured.width, height: measured.height }
      // Только первое измерение: иначе сбросим то, что подвинули руками.
      if (first) {
        showCurrent()
      }
    })
    observer.observe(element)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => observer?.disconnect())

watch(() => [props.course, props.currentModuleId], showCurrent)
</script>

<template>
  <section
    v-if="layout.nodes.length > 0"
    class="map"
    :class="{ 'map--collapsed': !expanded }"
    aria-label="Карта курса"
  >
    <header class="head">
      <button type="button" class="bar" :aria-expanded="expanded" @click="toggle">
        <span class="chevron" aria-hidden="true"></span>
        <span class="title">карта курса</span>
        <span v-if="expanded" class="hint">потяните за пустое место</span>
      </button>

      <div v-if="expanded" class="controls">
        <button type="button" class="control" aria-label="Отдалить" @click="zoomBy(1 / 1.2)">
          −
        </button>
        <button type="button" class="control" aria-label="Приблизить" @click="zoomBy(1.2)">
          +
        </button>
        <button type="button" class="control control--wide" @click="showCurrent">к текущему</button>
        <button type="button" class="control control--wide" @click="fit">вся карта</button>
      </div>
    </header>

    <div
      v-if="expanded"
      ref="viewport"
      class="viewport"
      :class="{ 'viewport--panning': panning }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endPan"
      @pointercancel="endPan"
      @wheel="onWheel"
    >
      <div
        class="stage"
        :style="{
          transform: `translate(${String(view.x)}px, ${String(view.y)}px) scale(${String(view.scale)})`,
        }"
      >
        <ModuleGraphCanvas
          :layout="layout"
          :modules="props.modules"
          :progress="moduleProgress"
          :selected="props.currentModuleId"
          @select="openModule"
          @focus-node="revealNode"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  flex: var(--panel-grow, 1) 1 0;
  height: var(--panel-height, auto);
  min-height: 0;
  container-type: inline-size;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.map--collapsed {
  flex: 0 0 auto;
  height: auto;
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-3);
}

.bar {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--motion-fast) var(--ease);
}

.bar:hover {
  background: var(--surface);
}

.chevron::before {
  content: '+';
  color: var(--text-muted);
}

.bar[aria-expanded='true'] .chevron::before {
  content: '−';
}

.title {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
}

.hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
}

.control {
  min-width: var(--ctl-sm);
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.control:hover {
  background: var(--surface);
  color: var(--text);
}

.control--wide {
  min-width: 0;
}

.viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: var(--map-height-compact);
  border-top: 1px solid var(--border);
  overflow: hidden;
  cursor: grab;
  /* Вертикальную прокрутку страницы оставляем браузеру: иначе на тач-экране
     мимо доски не проскроллить. */
  touch-action: pan-y;
}

.viewport--panning {
  cursor: grabbing;
}

.stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

@container (max-width: 620px) {
  .hint {
    display: none;
  }
}
</style>

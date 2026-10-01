<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import type { ModuleDependency, ModuleTree } from '@/api/schemas/content'
import type { ModuleProgress } from '@/api/schemas/learning'
import { useExpandablePanel } from '@/composables/useExpandablePanel'
import { useGraphViewport } from '@/features/course-map/composables/useGraphViewport'
import { useProgressStore } from '@/stores/progress'
import ModuleGraphCanvas from './ModuleGraphCanvas.vue'
import { layoutGraph } from './graph'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  course: string
  modules: ModuleTree[]
  dependencies: ModuleDependency[]
  currentModuleId: string | null
}>()

const STORAGE_KEY = 'tramplin:course-map'

const router = useRouter()
const progress = useProgressStore()

const { expanded, sheet, toggle } = useExpandablePanel(STORAGE_KEY)
const layout = computed(() => layoutGraph(props.modules, props.dependencies))
const {
  endPan,
  fit,
  onPointerDown,
  onPointerMove,
  onWheel,
  panning,
  revealNode,
  setViewport,
  showCurrent,
  view,
  zoomBy,
} = useGraphViewport(layout, () => props.currentModuleId)

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
      : first.kind === 'quiz'
        ? { name: 'quiz', params: { ...params, quiz: first.quiz.slug } }
        : { name: 'algorithm-practice', params: { ...params, set: first.practiceSet.id } },
  )
}
</script>

<template>
  <section
    v-if="layout.nodes.length > 0"
    class="map"
    :class="{ 'map--collapsed': !expanded, 'map--sheet': sheet }"
    :aria-label="t('map.label')"
  >
    <header class="head">
      <button type="button" class="bar" :aria-expanded="expanded" @click="toggle">
        <span class="chevron" aria-hidden="true"></span>
        <span class="title">{{ t('course.map') }}</span>
        <span v-if="expanded" class="hint">{{ t('map.dragHint') }}</span>
      </button>

      <div v-if="expanded" class="controls">
        <button
          type="button"
          class="control"
          :aria-label="t('map.zoomOut')"
          @click="zoomBy(1 / 1.2)"
        >
          −
        </button>
        <button type="button" class="control" :aria-label="t('map.zoomIn')" @click="zoomBy(1.2)">
          +
        </button>
        <button type="button" class="control control--wide" @click="showCurrent">
          {{ t('map.current') }}
        </button>
        <button type="button" class="control control--wide" @click="fit">{{ t('map.fit') }}</button>
        <button v-if="sheet" type="button" class="control control--wide" @click="toggle">
          {{ t('map.close') }}
        </button>
      </div>
    </header>

    <div
      v-if="expanded"
      :ref="setViewport"
      class="viewport"
      :class="{ 'viewport--panning': panning, 'viewport--sheet': sheet }"
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

/* Телефон: раскрытая карта уезжала бы под текст урока, а её жест панорамы
   спорил бы с прокруткой страницы. На весь экран — прокручивать нечего,
   поэтому доску можно тянуть в обе стороны. */
@media (max-width: 800px) {
  .map--sheet {
    position: fixed;
    inset: 0;
    z-index: 60;
    height: 100dvh;
    border: none;
    border-radius: 0;
  }

  .map--sheet .head {
    flex-wrap: wrap;
    padding-top: max(var(--space-2), env(safe-area-inset-top));
  }

  .viewport--sheet {
    touch-action: none;
    padding-bottom: env(safe-area-inset-bottom);
  }
}

@container (max-width: 620px) {
  .hint {
    display: none;
  }
}
</style>

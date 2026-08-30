<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import type { CourseTree, ModuleTree } from '@/api/schemas/content'
import ModuleGraph from '@/components/course/ModuleGraph.vue'
import LoadState from '@/components/ui/LoadState.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ course: string }>()

const detail = ref<HTMLElement | null>(null)

const content = useContentStore()
const progress = useProgressStore()
const auth = useAuthStore()

const tree = ref<CourseTree | null>(null)
const pending = ref(true)
const error = ref<unknown>(null)
const selectedId = ref<string | null>(null)

const dependencies = computed(() => content.courseDependencies(props.course))
const courseProgress = computed(() => progress.courseProgress.get(props.course) ?? null)
const moduleProgress = computed(() => courseProgress.value?.modules ?? [])

const selected = computed<ModuleTree | null>(
  () => tree.value?.modules.find((module) => module.id === selectedId.value) ?? null,
)

function firstUnfinished(loaded: CourseTree): string | null {
  const done = new Map(moduleProgress.value.map((item) => [item.moduleId, item]))
  const pendingModule = loaded.modules.find((module) => {
    const item = done.get(module.id)
    return !item || item.totalLessons === 0 || item.completedLessons < item.totalLessons
  })
  return (pendingModule ?? loaded.modules[0])?.id ?? null
}

async function load(slug: string): Promise<void> {
  pending.value = true
  error.value = null
  try {
    const loaded = await content.loadCourse(slug)
    tree.value = loaded
    await progress.load()
    await progress.loadCourseProgress(slug)
    selectedId.value = firstUnfinished(loaded)
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

function select(moduleId: string): void {
  selectedId.value = moduleId
  void nextTick(() => {
    detail.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

onMounted(() => void load(props.course))
watch(
  () => props.course,
  (slug) => void load(slug),
)
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <article v-if="tree">
      <header class="head">
        <h1 class="title">{{ tree.title }}</h1>
        <p v-if="tree.summary" class="summary">{{ tree.summary }}</p>

        <div v-if="auth.isAuthenticated && courseProgress" class="progress">
          <ProgressBar
            :value="courseProgress.completedLessons"
            :max="courseProgress.totalLessons"
            label="Прогресс по курсу"
          />
          <span class="progress-text">
            {{ courseProgress.completedLessons }} из {{ courseProgress.totalLessons }} уроков
          </span>
        </div>
      </header>

      <section v-if="tree.modules.length > 0" class="map">
        <div class="map-head">
          <h2 class="section-title">карта курса</h2>
          <p class="hint">
            Связи — рекомендованный порядок, а не замок: открыть можно любой модуль.
          </p>
        </div>

        <ModuleGraph
          :modules="tree.modules"
          :dependencies="dependencies"
          :progress="moduleProgress"
          :selected="selectedId"
          @select="select"
        />
      </section>

      <p v-else class="empty">в курсе пока нет модулей</p>

      <section v-if="selected" ref="detail" class="detail" :aria-label="selected.title">
        <header class="detail-head">
          <h2 class="detail-title">{{ selected.title }}</h2>
          <p v-if="selected.summary" class="detail-summary">{{ selected.summary }}</p>
        </header>

        <p v-if="selected.items.length === 0" class="empty">в модуле пока нет материалов</p>

        <ul v-else class="list">
          <li v-for="item in selected.items" :key="item.id">
            <RouterLink
              v-if="item.kind === 'lesson'"
              class="row"
              :to="{
                name: 'lesson',
                params: { course: tree.slug, module: selected.slug, lesson: item.lesson.slug },
              }"
            >
              <span class="dot" :class="{ 'dot--done': progress.isCompleted(item.lesson.id) }" />
              <span class="row-title">{{ item.lesson.title }}</span>
              <span v-if="item.lesson.estMinutes !== null" class="row-meta">
                {{ item.lesson.estMinutes }} мин
              </span>
            </RouterLink>
            <RouterLink
              v-else
              class="row"
              :to="{
                name: 'quiz',
                params: { course: tree.slug, module: selected.slug, quiz: item.quiz.slug },
              }"
            >
              <span class="dot dot--quiz" />
              <span class="row-title">{{ item.quiz.title }}</span>
              <span class="row-meta">тест</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </article>
  </LoadState>
</template>

<style scoped>
.head {
  max-width: var(--measure);
  margin-bottom: var(--space-8);
}

.title {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.summary {
  margin-top: var(--space-3);
  color: var(--text-muted);
}

.progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.progress-text {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.map {
  margin: 0 calc(var(--space-8) * -1) var(--space-8);
  padding: var(--space-6) var(--space-8) var(--space-8);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.map-head {
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
}

.hint {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.detail {
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.detail-head {
  margin-bottom: var(--space-4);
}

.detail-title {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
}

.detail-summary {
  max-width: var(--measure);
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.list {
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-ctl);
  transition: background var(--motion-fast) var(--ease);
}

.row:hover {
  background: var(--surface);
}

.dot {
  flex-shrink: 0;
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--border);
}

.dot--done {
  background: var(--success);
}

.dot--quiz {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--text-muted);
}

.row-title {
  flex: 1;
  font-size: var(--text-body);
}

.row-meta {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.empty {
  padding: var(--space-8) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

@media (max-width: 800px) {
  .map {
    margin-inline: calc(var(--space-4) * -1);
    padding: var(--space-4);
  }
}
</style>

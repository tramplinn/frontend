<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { listInterviewCards } from '@/api/content'
import type { InterviewCard } from '@/api/schemas/content'
import ModuleMap from '@/components/course/ModuleMap.vue'
import InterviewCards from '@/components/lesson/InterviewCards.vue'
import LessonChat from '@/components/lesson/LessonChat.vue'
import ModulePager from '@/components/lesson/ModulePager.vue'
import LessonBody from '@/components/lesson/LessonBody.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { MissingContentError } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import type { LessonLocation } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ course: string; module: string; lesson: string }>()

const content = useContentStore()
const progress = useProgressStore()
const auth = useAuthStore()

const location = ref<LessonLocation | null>(null)
const cards = ref<InterviewCard[]>([])
const pending = ref(true)
const error = ref<unknown>(null)
const saving = ref(false)
const progressError = ref<string | null>(null)

const courseModules = computed(() => content.courses.get(props.course)?.modules ?? [])

const isCompleted = computed(() =>
  location.value ? progress.isCompleted(location.value.lesson.id) : false,
)

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    await content.loadCourse(props.course)
    const found = content.findLesson(props.course, props.module, props.lesson)
    location.value = found
    if (!found) {
      error.value = new MissingContentError('Урок')
      return
    }
    await progress.load()
    cards.value = await listInterviewCards(found.lesson.id)
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

async function toggleCompleted(): Promise<void> {
  const current = location.value
  if (!current) {
    return
  }
  saving.value = true
  progressError.value = null
  try {
    if (isCompleted.value) {
      await progress.markReopened(current.lesson.id, props.course)
    } else {
      await progress.markCompleted(current.lesson.id, props.course)
    }
  } catch {
    progressError.value = 'Не удалось сохранить отметку. Попробуйте ещё раз.'
  } finally {
    saving.value = false
  }
}

async function signIn(): Promise<void> {
  await auth.login(`/courses/${props.course}/${props.module}/lessons/${props.lesson}`)
}

onMounted(() => void load())
watch(
  () => [props.course, props.module, props.lesson],
  () => void load(),
)
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <div v-if="location" class="layout">
      <article class="lesson">
        <header class="head">
          <h1 class="title">{{ location.lesson.title }}</h1>
          <span v-if="location.lesson.estMinutes !== null" class="meta">
            {{ location.lesson.estMinutes }} мин
          </span>
        </header>

        <div class="sheet">
          <LessonBody :html="location.lesson.bodyHtml" />
        </div>

        <InterviewCards :cards="cards" />

        <footer class="footer">
          <div class="action">
            <AppButton
              v-if="auth.isAuthenticated"
              :variant="isCompleted ? 'secondary' : 'primary'"
              :loading="saving"
              @click="toggleCompleted"
            >
              {{ isCompleted ? 'пройдено' : 'отметить пройденным' }}
            </AppButton>
            <AppButton v-else variant="primary" @click="signIn">
              войти, чтобы отмечать прогресс
            </AppButton>
            <p v-if="progressError" class="action-error" role="alert">{{ progressError }}</p>
          </div>

          <ModulePager
            :course="props.course"
            :module="location.module"
            :current-id="location.lesson.id"
          />
        </footer>
      </article>

      <aside class="rail">
        <ModuleMap
          :course="props.course"
          :modules="courseModules"
          :dependencies="content.courseDependencies(props.course)"
          :current-module-id="location.module.id"
        />
        <LessonChat :lesson-id="location.lesson.id" />
      </aside>
    </div>
  </LoadState>
</template>

<style scoped>
.lesson {
  flex: 0 1 calc(var(--measure) + var(--space-12) * 2);
  min-width: 0;
  max-width: calc(var(--measure) + var(--space-12) * 2);
}

.action-error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.layout {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
}

.rail {
  position: sticky;
  top: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1 1 320px;
  min-width: 0;
  height: calc(100dvh - var(--topbar) - var(--space-12));
}

@media (max-width: 1480px) {
  .layout {
    display: block;
  }

  .rail {
    position: static;
    display: flex;
    height: auto;
    margin-top: var(--space-12);
    --panel-grow: 0;
    --panel-height: var(--map-height);
  }
}

@media (max-width: 800px) {
  .rail {
    --panel-height: var(--map-height-compact);
  }
}

.sheet {
  padding: var(--space-12);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

@media (max-width: 800px) {
  .sheet {
    padding: var(--space-6);
  }
}

.head {
  margin-bottom: var(--space-8);
}

.title {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.meta {
  display: block;
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-12);
  padding-top: var(--space-8);
  border-top: 1px solid var(--border);
}

.action {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>

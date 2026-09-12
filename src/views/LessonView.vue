<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { listInterviewCards } from '@/api/content'
import type { InterviewCard } from '@/api/schemas/content'
import ModuleMap from '@/components/course/ModuleMap.vue'
import SignInButton from '@/components/layout/SignInButton.vue'
import LearningPageLayout from '@/components/learning/LearningPageLayout.vue'
import InterviewCards from '@/components/lesson/InterviewCards.vue'
import LessonBody from '@/components/lesson/LessonBody.vue'
import LessonChat from '@/components/lesson/LessonChat.vue'
import ModulePager from '@/components/lesson/ModulePager.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { runBusyAction } from '@/lib/asyncAction'
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
const cardsError = ref(false)
let loadVersion = 0

const courseModules = computed(() => content.courses.get(props.course)?.modules ?? [])

const isCompleted = computed(() =>
  location.value ? progress.isCompleted(location.value.lesson.id) : false,
)

async function load(): Promise<void> {
  const version = ++loadVersion
  const target = { course: props.course, module: props.module, lesson: props.lesson }
  pending.value = true
  error.value = null
  location.value = null
  cards.value = []
  cardsError.value = false
  progressError.value = null
  try {
    await content.loadCourse(target.course)
    if (version !== loadVersion) return
    const found = content.findLesson(target.course, target.module, target.lesson)
    location.value = found
    if (!found) {
      error.value = new MissingContentError('Урок')
      return
    }
    await Promise.all([
      progress.load().catch(() => {
        if (version === loadVersion) {
          progressError.value = 'Прогресс временно недоступен.'
        }
      }),
      listInterviewCards(found.lesson.id)
        .then((loadedCards) => {
          if (version === loadVersion) cards.value = loadedCards
        })
        .catch(() => {
          if (version === loadVersion) cardsError.value = true
        }),
    ])
  } catch (cause) {
    if (version !== loadVersion) return
    error.value = cause
  } finally {
    if (version === loadVersion) pending.value = false
  }
}

async function toggleCompleted(): Promise<void> {
  const current = location.value
  if (!current) {
    return
  }
  await runBusyAction(
    {
      setBusy: (active) => (saving.value = active),
      clearError: () => (progressError.value = null),
      setError: () => (progressError.value = 'Не удалось сохранить отметку. Попробуйте ещё раз.'),
    },
    async () => {
      if (isCompleted.value) {
        await progress.markReopened(current.lesson.id, props.course)
      } else {
        await progress.markCompleted(current.lesson.id, props.course)
      }
    },
  )
}

onMounted(() => void load())
watch(
  () => [props.course, props.module, props.lesson],
  () => void load(),
)
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <LearningPageLayout v-if="location" prioritize-rail-end-on-mobile>
      <template #header>
        <h1 class="title">{{ location.lesson.title }}</h1>
        <span v-if="location.lesson.estMinutes !== null" class="meta">
          {{ location.lesson.estMinutes }} мин
        </span>
      </template>

      <LessonBody :html="location.lesson.bodyHtml" />

      <template #after-sheet>
        <p v-if="cardsError" class="support-error" role="status">
          Вопросы к собеседованию временно недоступны.
        </p>
        <InterviewCards :cards="cards" />
      </template>

      <template #footer>
        <div class="action">
          <AppButton
            v-if="auth.isAuthenticated"
            :variant="isCompleted ? 'secondary' : 'primary'"
            :loading="saving"
            @click="toggleCompleted"
          >
            {{ isCompleted ? 'пройдено' : 'отметить пройденным' }}
          </AppButton>
          <SignInButton
            v-else
            label="войти, чтобы отмечать прогресс"
            :next-path="`/courses/${props.course}/${props.module}/lessons/${props.lesson}`"
          />
          <p v-if="progressError" class="action-error" role="alert">{{ progressError }}</p>
        </div>

        <ModulePager
          :course="props.course"
          :module="location.module"
          :current-id="location.lesson.id"
        />
      </template>

      <template #rail>
        <ModuleMap
          :course="props.course"
          :modules="courseModules"
          :dependencies="content.courseDependencies(props.course)"
          :current-module-id="location.module.id"
        />
        <LessonChat :lesson-id="location.lesson.id" />
      </template>
    </LearningPageLayout>
  </LoadState>
</template>

<style scoped>
.action-error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.support-error {
  margin-top: var(--space-4);
  color: var(--text-muted);
  font-size: var(--text-caption);
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

.action {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>

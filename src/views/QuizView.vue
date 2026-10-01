<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { getQuiz } from '@/api/content'
import { listQuizAttempts, submitQuiz } from '@/api/learning'
import type { Quiz } from '@/api/schemas/content'
import type { QuizAttempt } from '@/api/schemas/learning'
import ModuleMap from '@/components/course/ModuleMap.vue'
import ModulePager from '@/components/lesson/ModulePager.vue'
import LearningPageLayout from '@/components/learning/LearningPageLayout.vue'
import QuizRunner from '@/components/quiz/QuizRunner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { MissingContentError, errorText } from '@/lib/errors'
import { useContentStore } from '@/stores/content'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ course: string; module: string; quiz: string }>()

const content = useContentStore()

const loaded = ref<Quiz | null>(null)
const attempt = ref<QuizAttempt | null>(null)
const previous = ref<QuizAttempt[]>([])
const pending = ref(true)
const submitting = ref(false)
const error = ref<unknown>(null)
const submitError = ref<unknown>(null)
/** Растёт только при «пройти заново»: после проверки ответы должны
    остаться на экране рядом с вердиктами, иначе разбор бессмыслен. */
const runKey = ref(0)
let loadVersion = 0

const best = computed(() =>
  previous.value.reduce<QuizAttempt | null>(
    (top, item) => (top === null || item.score > top.score ? item : top),
    null,
  ),
)

const place = computed(() => content.findQuiz(props.course, props.module, props.quiz))

const courseModules = computed(() => content.courses.get(props.course)?.modules ?? [])

async function load(): Promise<void> {
  const version = ++loadVersion
  const target = { course: props.course, module: props.module, quiz: props.quiz }
  pending.value = true
  error.value = null
  attempt.value = null
  loaded.value = null
  previous.value = []
  try {
    await content.loadCourse(target.course)
    if (version !== loadVersion) return
    const found = content.findQuiz(target.course, target.module, target.quiz)
    if (!found) {
      error.value = new MissingContentError('quiz')
      return
    }
    // В дереве курса вопросы уже есть, но берём тест отдельно:
    // так он гарантированно свежий и не зависит от кэша курса.
    const [quiz, attempts] = await Promise.all([
      getQuiz(found.quiz.id),
      listQuizAttempts(found.quiz.id),
    ])
    if (version !== loadVersion) return
    loaded.value = quiz
    previous.value = attempts
  } catch (cause) {
    if (version !== loadVersion) return
    error.value = cause
  } finally {
    if (version === loadVersion) pending.value = false
  }
}

async function send(answers: Record<string, unknown>): Promise<void> {
  const current = loaded.value
  if (!current) {
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    attempt.value = await submitQuiz(current.id, answers)
    previous.value = await listQuizAttempts(current.id)
  } catch (cause) {
    submitError.value = cause
  } finally {
    submitting.value = false
  }
}

function retry(): void {
  attempt.value = null
  runKey.value += 1
}

onMounted(() => void load())
watch(
  () => [props.course, props.module, props.quiz],
  () => void load(),
)
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <LearningPageLayout v-if="loaded" sheet-padding="compact">
      <template #header>
        <h1 class="title">{{ loaded.title }}</h1>
        <p v-if="best && !attempt" class="meta">
          {{ t('quiz.best', { score: best.score, max: best.maxScore }) }}
        </p>
      </template>

      <template #before-sheet>
        <div v-if="attempt" class="score">
          <span class="score-value">{{ attempt.score }} / {{ attempt.maxScore }}</span>
          <AppButton size="sm" @click="retry">{{ t('quiz.retry') }}</AppButton>
        </div>

        <p v-if="submitError" class="submit-error" role="alert">{{ errorText(submitError) }}</p>
      </template>

      <QuizRunner
        :key="`${loaded.id}-${runKey}`"
        :quiz="loaded"
        :submitting="submitting"
        :attempt="attempt"
        @submit="send"
      />

      <template #footer>
        <ModulePager
          v-if="place"
          :course="props.course"
          :module="place.module"
          :current-id="place.quiz.id"
        />
      </template>

      <template v-if="place" #rail>
        <ModuleMap
          :course="props.course"
          :modules="courseModules"
          :dependencies="content.courseDependencies(props.course)"
          :current-module-id="place.module.id"
        />
      </template>
    </LearningPageLayout>
  </LoadState>
</template>

<style scoped>
.submit-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.title {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.meta {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.score {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.score-value {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
}
</style>

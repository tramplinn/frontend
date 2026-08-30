<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { getQuiz } from '@/api/content'
import { listQuizAttempts, submitQuiz } from '@/api/learning'
import type { Quiz } from '@/api/schemas/content'
import type { QuizAttempt } from '@/api/schemas/learning'
import ModuleMap from '@/components/course/ModuleMap.vue'
import ModulePager from '@/components/lesson/ModulePager.vue'
import QuizRunner from '@/components/quiz/QuizRunner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { MissingContentError, errorText } from '@/lib/errors'
import { useContentStore } from '@/stores/content'

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

const best = computed(() =>
  previous.value.reduce<QuizAttempt | null>(
    (top, item) => (top === null || item.score > top.score ? item : top),
    null,
  ),
)

const place = computed(() => content.findQuiz(props.course, props.module, props.quiz))

const courseModules = computed(() => content.courses.get(props.course)?.modules ?? [])

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  attempt.value = null
  try {
    await content.loadCourse(props.course)
    const found = content.findQuiz(props.course, props.module, props.quiz)
    if (!found) {
      error.value = new MissingContentError('Тест')
      return
    }
    // В дереве курса вопросы уже есть, но берём тест отдельно:
    // так он гарантированно свежий и не зависит от кэша курса.
    loaded.value = await getQuiz(found.quiz.id)
    previous.value = await listQuizAttempts(found.quiz.id)
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
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
  <LoadState :pending="pending" :error="error">
    <div v-if="loaded" class="layout">
      <section class="quiz">
        <header class="head">
          <h1 class="title">{{ loaded.title }}</h1>
          <p v-if="best && !attempt" class="meta">
            лучший результат: {{ best.score }} из {{ best.maxScore }}
          </p>
        </header>

        <div v-if="attempt" class="score">
          <span class="score-value">{{ attempt.score }} / {{ attempt.maxScore }}</span>
          <AppButton size="sm" @click="retry">пройти заново</AppButton>
        </div>

        <p v-if="submitError" class="submit-error" role="alert">{{ errorText(submitError) }}</p>

        <div class="sheet">
          <QuizRunner
            :key="`${loaded.id}-${runKey}`"
            :quiz="loaded"
            :submitting="submitting"
            :attempt="attempt"
            @submit="send"
          />
        </div>

        <footer class="footer">
          <ModulePager
            v-if="place"
            :course="props.course"
            :module="place.module"
            :current-id="place.quiz.id"
          />
        </footer>
      </section>

      <aside v-if="place" class="rail">
        <ModuleMap
          :course="props.course"
          :modules="courseModules"
          :dependencies="content.courseDependencies(props.course)"
          :current-module-id="place.module.id"
        />
      </aside>
    </div>
  </LoadState>
</template>

<style scoped>
.quiz {
  flex: 0 1 calc(var(--measure) + var(--space-12) * 2);
  min-width: 0;
  max-width: calc(var(--measure) + var(--space-12) * 2);
}

.footer {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
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

.submit-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.sheet {
  padding: var(--space-8) var(--space-12);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

@media (max-width: 800px) {
  .sheet {
    padding: var(--space-6) var(--space-4);
  }
}

.head {
  margin-bottom: var(--space-8);
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

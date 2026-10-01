<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Quiz } from '@/api/schemas/content'
import type { QuizAttempt } from '@/api/schemas/learning'
import QuizChoiceAnswer from '@/components/quiz/QuizChoiceAnswer.vue'
import QuizFileAnswer from '@/components/quiz/QuizFileAnswer.vue'
import QuizInteractionAnswer from '@/components/quiz/QuizInteractionAnswer.vue'
import QuizQuestionFrame from '@/components/quiz/QuizQuestionFrame.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ quiz: Quiz; submitting: boolean; attempt: QuizAttempt | null }>()
const emit = defineEmits<{ submit: [answers: Record<string, unknown>] }>()

const answers = ref<Record<string, unknown>>({})
const resultsById = computed(
  () => new Map((props.attempt?.results ?? []).map((item) => [item.questionId, item])),
)
const isReviewing = computed(() => props.attempt !== null)

function setAnswer(questionId: string, value: unknown): void {
  answers.value = { ...answers.value, [questionId]: value }
}

function setTextAnswer(questionId: string, event: Event): void {
  const value = (event.target as HTMLInputElement).value
  answers.value = value.trim()
    ? { ...answers.value, [questionId]: value }
    : Object.fromEntries(Object.entries(answers.value).filter(([key]) => key !== questionId))
}
</script>

<template>
  <form class="quiz" @submit.prevent="emit('submit', answers)">
    <ol class="questions">
      <QuizQuestionFrame
        v-for="(question, index) in props.quiz.questions"
        :key="question.id"
        :question="question"
        :number="index + 1"
        :result="resultsById.get(question.id)"
      >
        <QuizChoiceAnswer
          v-if="question.type === 'single' || question.type === 'multiple'"
          :question="question"
          :reviewing="isReviewing"
          @answer="(value) => setAnswer(question.id, value)"
        />

        <input
          v-else-if="question.type === 'text'"
          class="text-input"
          type="text"
          :disabled="isReviewing"
          :placeholder="t('quiz.answer')"
          @input="setTextAnswer(question.id, $event)"
        />

        <QuizInteractionAnswer
          v-else-if="question.type === 'matching' || question.type === 'grouping'"
          :question="question"
          :reviewing="isReviewing"
          @answer="(value) => setAnswer(question.id, value)"
        />

        <QuizFileAnswer
          v-else
          :question-id="question.id"
          :reviewing="isReviewing"
          @answer="(value) => setAnswer(question.id, value)"
        />
      </QuizQuestionFrame>
    </ol>

    <AppButton v-if="!isReviewing" type="submit" variant="primary" :loading="props.submitting">
      {{ t('quiz.check') }}
    </AppButton>
  </form>
</template>

<style scoped>
.questions {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: var(--measure);
  margin-bottom: var(--space-8);
}

.text-input {
  width: 100%;
  max-width: 360px;
  height: var(--ctl-md);
  padding: 0 var(--space-4);
  margin-left: var(--space-8);
  border: none;
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

@media (max-width: 620px) {
  .text-input {
    margin-left: 0;
  }
}
</style>

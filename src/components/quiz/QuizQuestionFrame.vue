<script setup lang="ts">
import type { QuizQuestion } from '@/api/schemas/content'
import type { QuestionResult } from '@/api/schemas/learning'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{
  question: QuizQuestion
  number: number
  result: QuestionResult | undefined
}>()
</script>

<template>
  <li class="question">
    <div class="prompt">
      <span class="index">{{ number }}</span>
      <p class="prompt-text">{{ question.promptMd }}</p>
    </div>

    <div v-if="question.attachments.length" class="materials">
      <span class="materials-label">{{ t('quiz.materials') }}</span>
      <a
        v-for="asset in question.attachments"
        :key="asset.id"
        :href="asset.url"
        target="_blank"
        rel="noopener"
      >
        {{ asset.filename }}
      </a>
    </div>

    <slot />

    <p v-if="result" class="verdict" :class="result.correct ? 'verdict--ok' : 'verdict--bad'">
      {{ result.correct ? t('quiz.correct') : t('quiz.incorrect') }}
      <span v-if="result.explanation" class="explain"> — {{ result.explanation }} </span>
    </p>
  </li>
</template>

<style scoped>
.prompt {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.index {
  flex-shrink: 0;
  width: var(--space-6);
  color: var(--text-muted);
  font-size: var(--text-caption);
  line-height: 1.7;
}

.prompt-text {
  min-width: 0;
  font-weight: var(--weight-medium);
}

.materials {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0 0 var(--space-4) var(--space-8);
  font-size: var(--text-caption);
}

.materials-label,
.explain {
  color: var(--text-muted);
}

.verdict {
  margin-top: var(--space-3);
  padding-left: var(--space-8);
  font-size: var(--text-caption);
}

.verdict--ok {
  color: var(--success);
}

.verdict--bad {
  color: var(--danger);
}

@media (max-width: 620px) {
  .materials {
    margin-left: 0;
  }

  .verdict {
    padding-left: 0;
  }
}
</style>

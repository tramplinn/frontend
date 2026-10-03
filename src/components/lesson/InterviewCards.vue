<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'

import type { InterviewCard } from '@/api/schemas/content'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ cards: InterviewCard[] }>()
</script>

<template>
  <section v-if="props.cards.length > 0" class="cards">
    <h2 class="heading">{{ t('lesson.interviewQuestions') }}</h2>

    <CollapsibleRoot v-for="card in props.cards" :key="card.id" class="card">
      <CollapsibleTrigger class="question">
        <span class="question-text">{{ card.questionMd }}</span>
        <ChevronDown class="toggle" :size="18" aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent class="answer">
        <p class="answer-text">{{ card.answerMd }}</p>
      </CollapsibleContent>
    </CollapsibleRoot>
  </section>
</template>

<style scoped>
.cards {
  margin-top: var(--space-12);
}

.heading {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  margin-bottom: var(--space-4);
}

.card {
  display: block;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.card + .card {
  margin-top: var(--space-2);
}

.question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-4) var(--space-6);
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.question-text {
  font-weight: var(--weight-medium);
}

.toggle {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform var(--motion-fast) var(--ease);
}

.question[data-state='open'] .toggle {
  transform: rotate(180deg);
}

.answer {
  padding: 0 var(--space-6) var(--space-4);
}

.answer-text {
  color: var(--text-muted);
  white-space: pre-wrap;
}
</style>

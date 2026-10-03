<script setup lang="ts">
import { ref } from 'vue'

import AlgorithmChat from '@/components/algorithms/AlgorithmChat.vue'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import ProblemEditorPanel from '@/components/algorithms/ProblemEditorPanel.vue'
import ProblemStatement from '@/components/algorithms/ProblemStatement.vue'
import ReflectionPanel from '@/components/algorithms/ReflectionPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useAlgorithmPractice } from '@/features/algorithms/composables/useAlgorithmPractice'
import { type MessageKey, useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ course: string; module: string; set: string }>()

const {
  error,
  finish,
  finishing,
  load,
  pending,
  practiceSet,
  runner,
  selectedId,
  session,
  solvedIds,
  timerText,
} = useAlgorithmPractice(() => props.set)

const closing = ref(false)
const summary = ref('')

const SESSION_LABELS: Record<string, MessageKey> = {
  active: 'practice.status.active',
  completed: 'practice.status.completed',
  expired: 'practice.status.expired',
}

function sessionLabel(status: string): string {
  const key = SESSION_LABELS[status]
  return key ? t(key) : status
}
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <article v-if="practiceSet && session" class="practice">
      <header class="head">
        <div>
          <BackLink :to="{ name: 'course', params: { course: props.course } }">{{
            t('practice.toCourse')
          }}</BackLink>
          <h1>{{ practiceSet.title }}</h1>
          <p v-if="practiceSet.description" class="muted">{{ practiceSet.description }}</p>
        </div>

        <div class="session-state">
          <strong v-if="timerText" class="timer">{{ timerText }}</strong>
          <span class="status">{{ sessionLabel(session.status) }}</span>
          <AppButton size="sm" :disabled="session.status !== 'active'" @click="closing = !closing">
            {{ t('practice.finish') }}
          </AppButton>
        </div>
      </header>

      <div v-if="closing && session.status === 'active'" class="closing">
        <label class="field">
          <span>{{ t('practice.takeaway') }}</span>
          <textarea v-model="summary" rows="3" :placeholder="t('practice.optional')" />
        </label>
        <div class="closing-actions">
          <AppButton :loading="finishing" @click="finish(summary.trim() || null)">
            {{ t('practice.finishSession') }}
          </AppButton>
          <AppButton variant="quiet" @click="closing = false">{{ t('profile.cancel') }}</AppButton>
        </div>
      </div>

      <div class="workspace">
        <aside class="tasks" :aria-label="t('practice.tasks')">
          <button
            v-for="(item, index) in practiceSet.problems"
            :key="item.problemId"
            class="task"
            :class="{ 'task--active': item.problemId === selectedId }"
            :aria-current="item.problemId === selectedId"
            @click="selectedId = item.problemId"
          >
            <span class="task-title">
              <span
                v-if="solvedIds.has(item.problemId)"
                class="tick"
                :aria-label="t('algorithms.solved')"
                >✓</span
              >
              {{ index + 1 }}. {{ item.title }}
            </span>
            <DifficultyChip :difficulty="item.difficulty" />
          </button>
        </aside>

        <section v-if="runner.problem.value" class="problem">
          <ProblemStatement :problem="runner.problem.value" />
          <div class="right">
            <ProblemEditorPanel :runner="runner" />
            <ReflectionPanel :runner="runner" @save="runner.saveReflection" />
          </div>
        </section>

        <p v-else-if="practiceSet.problems.length === 0" class="muted">{{ t('practice.empty') }}</p>
      </div>

      <!-- В mock interview ассистент выключен: он бы свёл на нет смысл тренировки. -->
      <AlgorithmChat
        v-if="runner.problem.value && practiceSet.mode !== 'mock_interview'"
        :problem-id="runner.problem.value.id"
      />
    </article>
  </LoadState>
</template>

<style scoped>
.practice {
  display: grid;
  gap: var(--space-6);
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.head h1 {
  margin-top: var(--space-2);
  font-size: var(--text-display);
}

.muted,
.status {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.session-state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

.timer {
  font-family: var(--font-mono);
  font-size: var(--text-title);
}

.closing {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.field {
  display: grid;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

textarea {
  width: 100%;
  padding: var(--space-3);
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-input);
}

.closing-actions {
  display: flex;
  gap: var(--space-3);
}

.workspace {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.tasks {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border: 0;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--text-caption);
  text-align: left;
  cursor: pointer;
}

.task:hover {
  background: var(--surface);
}

.task--active {
  background: var(--accent-soft);
  color: var(--accent);
}

.task-title {
  min-width: 0;
}

.tick {
  color: var(--success);
  font-weight: var(--weight-medium);
}

.problem {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(360px, 1.15fr);
  gap: var(--space-4);
  align-items: start;
  min-width: 0;
}

.right {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

@media (max-width: 1100px) {
  .problem {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .tasks {
    display: flex;
    overflow-x: auto;
  }

  .task {
    min-width: 200px;
  }

  .head {
    flex-direction: column;
  }
}
</style>

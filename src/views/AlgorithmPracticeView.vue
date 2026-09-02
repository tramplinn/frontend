<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useAlgorithmPractice } from '@/features/algorithms/composables/useAlgorithmPractice'
import { errorText } from '@/lib/errors'

const props = defineProps<{ course: string; module: string; set: string }>()
const {
  canExecute,
  changeLanguage,
  customInput,
  error,
  execute,
  finish,
  language,
  pending,
  practiceSet,
  problem,
  problemPending,
  queueStatus,
  result,
  runError,
  running,
  selectedId,
  session,
  sourceCode,
  timerText,
} = useAlgorithmPractice(() => props.set)
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <article v-if="practiceSet && session" class="practice">
      <header class="head">
        <div>
          <RouterLink :to="{ name: 'course', params: { course: props.course } }" class="back">
            ← к курсу
          </RouterLink>
          <h1>{{ practiceSet.title }}</h1>
          <p v-if="practiceSet.description" class="muted">{{ practiceSet.description }}</p>
        </div>
        <div class="session-state">
          <strong v-if="timerText" class="timer">{{ timerText }}</strong>
          <span>{{ session.status }}</span>
          <AppButton size="sm" :disabled="session.status !== 'active'" @click="finish">
            завершить
          </AppButton>
        </div>
      </header>

      <div class="workspace">
        <aside class="tasks" aria-label="Задачи">
          <button
            v-for="(item, index) in practiceSet.problems"
            :key="item.problemId"
            class="task"
            :class="{ 'task--active': item.problemId === selectedId }"
            @click="selectedId = item.problemId"
          >
            <span>{{ index + 1 }}. {{ item.title }}</span>
            <small>{{ item.difficulty }}</small>
          </button>
        </aside>

        <main v-if="problem" class="problem">
          <section class="statement">
            <h2>{{ problem.title }}</h2>
            <!-- HTML санитизируется backend markdown renderer. -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="prose" v-html="problem.statementHtml" />
            <details v-for="sample in problem.samples" :key="sample.position" class="sample">
              <summary>пример {{ sample.position + 1 }}</summary>
              <pre>
stdin
{{ sample.input }}</pre>
              <pre>
stdout
{{ sample.expectedOutput }}</pre>
            </details>
          </section>

          <section class="editor" :aria-busy="problemPending">
            <div class="toolbar">
              <label>
                <span class="sr-only">Язык</span>
                <select v-model="language" :disabled="running" @change="changeLanguage">
                  <option
                    v-for="item in problem.templates"
                    :key="item.language"
                    :value="item.language"
                  >
                    {{ item.language }}
                  </option>
                </select>
              </label>
              <span class="limits"
                >{{ problem.timeLimitMs }} мс ·
                {{ Math.round(problem.memoryLimitKb / 1024) }} МиБ</span
              >
            </div>
            <textarea
              v-model="sourceCode"
              class="code"
              spellcheck="false"
              aria-label="Исходный код"
            />
            <details class="stdin">
              <summary>свой stdin</summary>
              <textarea
                v-model="customInput"
                spellcheck="false"
                aria-label="Пользовательский stdin"
              />
            </details>
            <div class="actions">
              <AppButton :disabled="!canExecute" :loading="running" @click="execute('run')"
                >запустить</AppButton
              >
              <AppButton
                variant="primary"
                :disabled="!canExecute"
                :loading="running"
                @click="execute('submit')"
                >отправить</AppButton
              >
              <span
                v-if="queueStatus"
                class="result"
                :class="`result--${result?.verdict ?? 'pending'}`"
                >{{ queueStatus }}</span
              >
            </div>
            <p v-if="runError" class="error" role="alert">{{ errorText(runError) }}</p>
            <div v-if="result?.safeError" class="output error">{{ result.safeError }}</div>
            <div
              v-for="item in result?.cases ?? []"
              :key="item.position ?? 'custom'"
              class="output"
            >
              <strong
                >{{ item.position === null ? 'свой stdin' : `пример ${item.position + 1}` }} ·
                {{ item.verdict }}</strong
              >
              <pre v-if="item.stdout">{{ item.stdout }}</pre>
              <pre v-if="item.stderr" class="error">{{ item.stderr }}</pre>
            </div>
          </section>
        </main>
        <p v-else-if="practiceSet.problems.length === 0" class="muted">в наборе пока нет задач</p>
      </div>
    </article>
  </LoadState>
</template>

<style scoped>
.practice {
  display: grid;
  gap: var(--space-6);
}
.head,
.session-state,
.toolbar,
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.head {
  justify-content: space-between;
}
.head h1 {
  margin-top: var(--space-2);
  font-size: var(--text-display);
}
.back,
.muted,
.limits {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.session-state {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.timer {
  font-family: var(--font-mono);
  font-size: var(--text-title);
}
.workspace {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: var(--space-4);
}
.tasks,
.statement,
.editor {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}
.tasks {
  align-self: start;
  padding: var(--space-2);
}
.task {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3);
  border: 0;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.task--active {
  background: var(--accent-soft);
  color: var(--accent);
}
.task small {
  color: var(--text-muted);
}
.problem {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(360px, 1.15fr);
  gap: var(--space-4);
  min-width: 0;
}
.statement,
.editor {
  padding: var(--space-4);
  min-width: 0;
}
.statement h2 {
  margin-bottom: var(--space-4);
  font-size: var(--text-title);
}
.sample,
.stdin {
  margin-top: var(--space-4);
}
pre {
  overflow: auto;
  margin-top: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-mono);
  white-space: pre-wrap;
}
.toolbar {
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
select {
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: inherit;
}
textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: inherit;
  font: var(--text-input)/1.5 var(--font-mono);
}
.code {
  min-height: 420px;
  padding: var(--space-4);
}
.stdin textarea {
  min-height: 100px;
  margin-top: var(--space-2);
  padding: var(--space-3);
}
.actions {
  margin-top: var(--space-4);
}
.result {
  margin-left: auto;
  font-size: var(--text-caption);
}
.result--accepted {
  color: var(--success);
}
.result--wrong_answer,
.result--compile_error,
.result--runtime_error,
.result--internal_error {
  color: var(--danger);
}
.error {
  color: var(--danger);
}
.output {
  margin-top: var(--space-3);
  font-size: var(--text-caption);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
@media (max-width: 1000px) {
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
    min-width: 180px;
  }
  .head {
    align-items: flex-start;
  }
}
</style>

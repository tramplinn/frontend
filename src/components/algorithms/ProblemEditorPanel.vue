<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import type { useProblemRunner } from '@/features/algorithms/composables/useProblemRunner'
import { isAccepted, languageLabel, verdictLabel } from '@/lib/algorithms'
import { errorText } from '@/lib/errors'

const props = defineProps<{ runner: ReturnType<typeof useProblemRunner> }>()

/* Экземпляр runner создаётся один раз на экран и не подменяется,
   поэтому его можно разложить: рефы остаются реактивными. */
const {
  canExecute,
  customInput,
  execute,
  language,
  languages,
  problemPending,
  queueStatus,
  result,
  resetToStarter,
  runError,
  running,
  selectLanguage,
  sourceCode,
  unavailableLanguages,
} = props.runner

const languageOptions = computed(() =>
  languages.value.map((key) => ({ value: key, label: languageLabel(key) })),
)

const verdict = computed(() => result.value?.verdict ?? null)

const finished = computed(() => {
  const status = result.value?.status
  return status === 'finished' || status === 'failed'
})

const cases = computed(() => result.value?.cases ?? [])

/* result?.failedTest !== null в шаблоне дало бы true и на undefined,
   поэтому номер упавшего теста считаем здесь. */
const failedTest = computed(() => (finished.value ? (result.value?.failedTest ?? null) : null))
</script>

<template>
  <section class="editor" :aria-busy="problemPending">
    <div class="toolbar">
      <AppSelect
        v-if="languageOptions.length > 0"
        :model-value="language"
        :options="languageOptions"
        label="Язык решения"
        :disabled="running"
        @update:model-value="selectLanguage"
      />
      <p v-else class="muted">для задачи не настроен ни один доступный язык</p>

      <ConfirmButton
        label="решить заново"
        confirm-label="точно стереть решение?"
        :disabled="running"
        @confirm="resetToStarter"
      />

      <span
        v-if="queueStatus"
        class="verdict"
        :class="{
          'verdict--ok': finished && isAccepted(verdict),
          'verdict--bad': finished && !isAccepted(verdict),
        }"
      >
        {{ finished ? verdictLabel(verdict) : queueStatus }}
      </span>
    </div>

    <p v-if="unavailableLanguages.length > 0" class="hint">
      недоступны в раннере:
      {{ unavailableLanguages.map(languageLabel).join(', ') }}
    </p>

    <CodeEditor
      v-model="sourceCode"
      :language="language"
      :readonly="running"
      aria-label="Исходный код решения"
    />

    <details class="stdin">
      <summary>свой ввод для запуска</summary>
      <textarea v-model="customInput" spellcheck="false" aria-label="Пользовательский stdin" />
    </details>

    <div class="actions">
      <AppButton :disabled="!canExecute" :loading="running" @click="execute('run')">
        запустить
      </AppButton>
      <AppButton
        variant="primary"
        :disabled="!canExecute"
        :loading="running"
        @click="execute('submit')"
      >
        отправить
      </AppButton>
    </div>

    <p v-if="runError" class="error" role="alert">
      {{ errorText(runError) }}
    </p>

    <p v-if="result?.safeError" class="error" role="alert">
      {{ result?.safeError }}
    </p>

    <p v-if="failedTest !== null" class="error">упал тест {{ failedTest + 1 }}</p>

    <div v-for="item in cases" :key="item.position ?? 'custom'" class="case">
      <div class="case-head">
        <strong>{{ item.position === null ? 'свой ввод' : `пример ${item.position + 1}` }}</strong>
        <span :class="isAccepted(item.verdict) ? 'ok' : 'bad'">{{
          verdictLabel(item.verdict)
        }}</span>
        <span v-if="item.runtimeMs !== null" class="muted">{{ item.runtimeMs }} мс</span>
      </div>
      <pre v-if="item.stdout">{{ item.stdout }}</pre>
      <pre v-if="item.stderr" class="stderr">{{ item.stderr }}</pre>
    </div>
  </section>
</template>

<style scoped>
.editor {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  min-width: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  justify-content: space-between;
}

.verdict {
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}

.verdict--ok,
.ok {
  color: var(--success);
}

.verdict--bad,
.bad {
  color: var(--danger);
}

.muted,
.hint {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.stdin summary {
  color: var(--text-muted);
  font-size: var(--text-caption);
  cursor: pointer;
}

textarea {
  width: 100%;
  min-height: 100px;
  margin-top: var(--space-2);
  padding: var(--space-3);
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: inherit;
  font: var(--text-input) / 1.5 var(--font-mono);
}

.actions {
  display: flex;
  gap: var(--space-3);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.case-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--text-caption);
}

pre {
  overflow: auto;
  margin-top: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  white-space: pre-wrap;
}

.stderr {
  color: var(--danger);
}
</style>

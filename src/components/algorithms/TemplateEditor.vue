<script setup lang="ts">
import { computed } from 'vue'

import type { AlgorithmLanguage, TemplateAuthor } from '@/api/schemas/algorithmAuthoring'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import { languageLabel } from '@/lib/algorithms'

const props = defineProps<{
  languages: readonly AlgorithmLanguage[]
  used: Set<string>
  language: AlgorithmLanguage
  draft: { starterCode: string; solutionCode: string }
  saved: TemplateAuthor | undefined
  busy: boolean
  canValidate: boolean
}>()

const emit = defineEmits<{
  'update:language': [value: AlgorithmLanguage]
  patch: [changes: Partial<{ starterCode: string; solutionCode: string }>]
  validate: []
  remove: []
}>()

const options = computed(() =>
  props.languages.map((value) => ({
    value,
    label: props.used.has(value) ? `${languageLabel(value)} ✓` : languageLabel(value),
  })),
)

const validatedLabel = computed(() => {
  if (!props.saved) return 'сохранится автоматически'
  if (!props.saved.validatedAt) return 'эталонное решение не проверено'
  return `проверено ${new Date(props.saved.validatedAt).toLocaleString('ru-RU')}`
})
</script>

<template>
  <section class="templates">
    <header class="head">
      <h2>решения по языкам</h2>
      <AppSelect
        :model-value="props.language"
        :options="options"
        label="Язык шаблона"
        :disabled="props.busy"
        @update:model-value="(value) => emit('update:language', value)"
      />
      <span class="state" :class="{ 'state--ok': props.saved?.validatedAt }">
        {{ validatedLabel }}
      </span>
    </header>

    <div class="pair">
      <div class="field">
        <span class="label">заготовка для студента</span>
        <CodeEditor
          :model-value="props.draft.starterCode"
          :language="props.language"
          :highlight-active-line="false"
          min-height="220px"
          aria-label="Заготовка кода"
          @update:model-value="(value) => emit('patch', { starterCode: value })"
        />
      </div>

      <div class="field">
        <span class="label">эталонное решение</span>
        <CodeEditor
          :model-value="props.draft.solutionCode"
          :language="props.language"
          :highlight-active-line="false"
          min-height="220px"
          aria-label="Эталонное решение"
          @update:model-value="(value) => emit('patch', { solutionCode: value })"
        />
      </div>
    </div>

    <div class="actions">
      <AppButton
        variant="primary"
        :loading="props.busy"
        :disabled="!props.canValidate"
        @click="emit('validate')"
      >
        прогнать по тестам
      </AppButton>
      <ConfirmButton
        v-if="props.saved"
        label="убрать язык"
        confirm-label="точно убрать?"
        :loading="props.busy"
        @confirm="emit('remove')"
      />
    </div>

    <p v-if="!props.canValidate" class="hint">Добавьте хотя бы один тест и эталонное решение.</p>
  </section>
</template>

<style scoped>
.templates {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.head h2 {
  font-size: var(--text-title);
}

.state,
.hint,
.label {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.state--ok {
  color: var(--success);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.field {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>

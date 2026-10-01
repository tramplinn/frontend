<script setup lang="ts">
import { computed } from 'vue'

import type { AlgorithmLanguage, TemplateAuthor } from '@/api/schemas/algorithmAuthoring'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import { useI18n } from '@/i18n'
import { languageLabel } from '@/lib/algorithms'

const { d, t } = useI18n()

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
  if (!props.saved) return t('template.autosave')
  if (!props.saved.validatedAt) return t('template.unverified')
  return t('template.verifiedAt', {
    date: d(props.saved.validatedAt, { dateStyle: 'short', timeStyle: 'short' }),
  })
})
</script>

<template>
  <section class="templates">
    <header class="head">
      <h2>{{ t('template.heading') }}</h2>
      <AppSelect
        :model-value="props.language"
        :options="options"
        :label="t('template.language')"
        :disabled="props.busy"
        @update:model-value="(value) => emit('update:language', value)"
      />
      <span class="state" :class="{ 'state--ok': props.saved?.validatedAt }">
        {{ validatedLabel }}
      </span>
    </header>

    <div class="pair">
      <div class="field">
        <span class="label">{{ t('template.starter') }}</span>
        <CodeEditor
          :model-value="props.draft.starterCode"
          :language="props.language"
          :highlight-active-line="false"
          min-height="220px"
          :aria-label="t('template.starterLabel')"
          @update:model-value="(value) => emit('patch', { starterCode: value })"
        />
      </div>

      <div class="field">
        <span class="label">{{ t('template.solution') }}</span>
        <CodeEditor
          :model-value="props.draft.solutionCode"
          :language="props.language"
          :highlight-active-line="false"
          min-height="220px"
          :aria-label="t('template.solutionLabel')"
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
        {{ t('template.validate') }}
      </AppButton>
      <ConfirmButton
        v-if="props.saved"
        :label="t('template.removeLanguage')"
        :confirm-label="t('template.confirmRemove')"
        :loading="props.busy"
        @confirm="emit('remove')"
      />
    </div>

    <p v-if="!props.canValidate" class="hint">{{ t('template.needTests') }}</p>
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

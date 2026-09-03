<script setup lang="ts">
import type { TestCase } from '@/api/schemas/algorithmAuthoring'
import type { TestCaseFields } from '@/features/algorithms/composables/useProblemEditor'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'

const props = defineProps<{
  testCase: TestCase
  draft: TestCaseFields
  number: number
  busy: boolean
}>()

const emit = defineEmits<{
  patch: [changes: Partial<TestCaseFields>]
  save: []
  remove: []
}>()
</script>

<template>
  <li class="case">
    <header class="head">
      <strong>тест {{ props.number }}</strong>
      <span class="sample">
        <AppCheckbox
          :id="`sample-${props.testCase.id}`"
          :model-value="props.draft.isSample"
          @update:model-value="(value) => emit('patch', { isSample: value })"
        />
        <label :for="`sample-${props.testCase.id}`">показывать в условии</label>
      </span>
      <label class="weight">
        <span>вес</span>
        <input
          :value="props.draft.weight"
          type="number"
          min="1"
          max="100"
          @input="emit('patch', { weight: Number(($event.target as HTMLInputElement).value) || 1 })"
        />
      </label>
      <div class="actions">
        <AppButton size="sm" :loading="props.busy" @click="emit('save')">сохранить</AppButton>
        <ConfirmButton :loading="props.busy" @confirm="emit('remove')" />
      </div>
    </header>

    <div class="io">
      <label class="field">
        <span>ввод (stdin)</span>
        <textarea
          :value="props.draft.input"
          rows="4"
          spellcheck="false"
          @input="emit('patch', { input: ($event.target as HTMLTextAreaElement).value })"
        />
      </label>
      <label class="field">
        <span>ожидаемый вывод</span>
        <textarea
          :value="props.draft.expectedOutput"
          rows="4"
          spellcheck="false"
          @input="emit('patch', { expectedOutput: ($event.target as HTMLTextAreaElement).value })"
        />
      </label>
    </div>
  </li>
</template>

<style scoped>
.case {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  list-style: none;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.actions {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.sample {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.sample label {
  cursor: pointer;
}

.weight {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.weight input {
  width: 64px;
  height: var(--ctl-sm);
  padding: 0 var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
}

.io {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
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
  font: var(--text-input) / 1.5 var(--font-mono);
}

@media (max-width: 700px) {
  .io {
    grid-template-columns: 1fr;
  }
}
</style>

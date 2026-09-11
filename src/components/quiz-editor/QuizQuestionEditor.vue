<script setup lang="ts">
import { Label } from 'reka-ui'

import type { QuestionType } from '@/api/schemas/common'
import type { QuizQuestionAuthor } from '@/api/schemas/content'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import InteractionBlockEditor from '@/components/quiz-editor/InteractionBlockEditor.vue'
import type { EditableQuestion } from '@/features/quiz-editor/model/questionDraft'

defineProps<{
  question: QuizQuestionAuthor
  draft: EditableQuestion
  number: number
  busy: string | null
}>()

const emit = defineEmits<{
  patch: [changes: Partial<EditableQuestion>]
  toggleCorrect: [index: number]
  setOption: [index: number, value: string]
  addOption: []
  removeOption: [index: number]
  attach: [file: File]
  detach: [assetId: string]
  save: []
  remove: []
}>()

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'один ответ' },
  { value: 'multiple', label: 'несколько' },
  { value: 'text', label: 'текст' },
  { value: 'matching', label: 'связывание' },
  { value: 'grouping', label: 'по блокам' },
  { value: 'file', label: 'файл + самопроверка' },
]

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value
}

function textareaLines(event: Event): string[] {
  return (event.target as HTMLTextAreaElement).value.split('\n')
}

function pickAttachment(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('attach', file)
}
</script>

<template>
  <li class="question">
    <div class="question-head">
      <span class="index">{{ number }}</span>
      <input
        class="prompt"
        :value="draft.promptMd"
        aria-label="Текст вопроса"
        @input="emit('patch', { promptMd: inputValue($event) })"
      />
      <AppSelect
        :model-value="draft.type"
        :options="QUESTION_TYPES"
        label="Тип вопроса"
        @update:model-value="(type) => emit('patch', { type })"
      />
    </div>

    <div v-if="draft.type === 'single' || draft.type === 'multiple'" class="options">
      <div v-for="(option, index) in draft.options" :key="index" class="option">
        <button
          type="button"
          class="pick"
          :class="{ 'pick--on': draft.correct.includes(index) }"
          :aria-pressed="draft.correct.includes(index)"
          :aria-label="`Верный вариант ${String(index + 1)}`"
          @click="emit('toggleCorrect', index)"
        >
          ✓
        </button>
        <input
          class="option-input"
          :value="option"
          :aria-label="`Вариант ${String(index + 1)}`"
          @input="emit('setOption', index, inputValue($event))"
        />
        <AppButton size="sm" variant="quiet" @click="emit('removeOption', index)">
          убрать
        </AppButton>
      </div>
      <AppButton size="sm" variant="quiet" @click="emit('addOption')">+ вариант</AppButton>
    </div>

    <div v-else-if="draft.type === 'text'" class="accepted">
      <label class="label" :for="`accepted-${question.id}`">
        принимаемые ответы, по одному в строке
      </label>
      <textarea
        :id="`accepted-${question.id}`"
        class="accepted-input"
        :value="draft.accepted.join('\n')"
        rows="3"
        @input="emit('patch', { accepted: textareaLines($event) })"
      ></textarea>
      <div class="case">
        <AppCheckbox
          :id="`case-${question.id}`"
          :model-value="draft.caseSensitive"
          @update:model-value="(caseSensitive) => emit('patch', { caseSensitive })"
        />
        <Label :for="`case-${question.id}`" class="case-label">учитывать регистр</Label>
      </div>
    </div>

    <InteractionBlockEditor
      v-else-if="draft.type === 'matching' || draft.type === 'grouping'"
      :type="draft.type"
      :lines="draft.interactionLines"
      @change="(interactionLines) => emit('patch', { interactionLines })"
    />

    <p v-else class="file-note">
      Студент прикрепит изображение или PDF и сам отметит задание выполненным.
    </p>

    <div class="attachments">
      <span class="label">материалы к заданию</span>
      <span v-for="asset in draft.attachments" :key="asset.id" class="attachment">
        <a :href="asset.url" target="_blank" rel="noopener">{{ asset.filename }}</a>
        <button type="button" class="attachment-remove" @click="emit('detach', asset.id)">×</button>
      </span>
      <label class="attachment-add">
        + прикрепить файл
        <input
          class="visually-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          :disabled="busy === `attachment-${question.id}`"
          @change="pickAttachment"
        />
      </label>
    </div>

    <input
      class="explain"
      :value="draft.explainMd"
      placeholder="разбор, показывается после ответа"
      aria-label="Разбор"
      @input="emit('patch', { explainMd: inputValue($event) })"
    />

    <div class="question-actions">
      <AppButton size="sm" variant="primary" :loading="busy === question.id" @click="emit('save')">
        сохранить вопрос
      </AppButton>
      <ConfirmButton :loading="busy === question.id" @confirm="emit('remove')" />
    </div>
  </li>
</template>

<style scoped>
.question {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.question-head,
.option,
.case,
.question-actions,
.attachments {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.question-head {
  gap: var(--space-3);
}

.index {
  flex-shrink: 0;
  width: var(--space-4);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-variant-numeric: tabular-nums;
}

.prompt,
.option-input,
.explain,
.accepted-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-caption);
}

.prompt {
  flex: 1;
  min-width: 0;
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
}

.accepted-input {
  resize: vertical;
  line-height: 1.6;
}

.prompt:focus,
.option-input:focus,
.explain:focus,
.accepted-input:focus {
  outline: none;
  border-color: var(--accent);
}

.options,
.accepted {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding-left: var(--space-8);
}

.option {
  width: 100%;
}

.pick {
  flex-shrink: 0;
  width: var(--space-6);
  height: var(--space-6);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: transparent;
  font-size: var(--text-micro);
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.pick--on {
  border-color: var(--success);
  color: var(--success);
}

.file-note,
.attachments {
  margin-left: var(--space-8);
}

.file-note,
.label,
.case-label {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.attachments {
  flex-wrap: wrap;
}

.attachment,
.attachment-add {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  color: var(--text-muted);
  font-size: var(--text-caption);
  cursor: pointer;
}

.attachment-remove {
  margin-left: var(--space-2);
  border: 0;
  background: transparent;
  color: var(--danger);
  cursor: pointer;
}

.case-label {
  cursor: pointer;
}

.question-actions {
  padding-left: var(--space-8);
}

@media (max-width: 620px) {
  .question {
    padding: var(--space-4);
  }

  .question-head,
  .option {
    flex-wrap: wrap;
  }

  .prompt {
    flex-basis: calc(100% - var(--space-8));
  }

  .question-head > :deep(.trigger) {
    margin-left: var(--space-8);
  }

  .options,
  .accepted,
  .file-note,
  .attachments,
  .question-actions {
    padding-left: 0;
    margin-left: 0;
  }

  .option-input {
    flex: 1 1 calc(100% - var(--space-8));
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

import { Label } from 'reka-ui'

import type { QuestionType } from '@/api/schemas/common'
import type { QuizQuestionAuthor } from '@/api/schemas/content'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import InteractionBlockEditor from '@/components/quiz-editor/InteractionBlockEditor.vue'
import type { EditableQuestion } from '@/features/quiz-editor/model/questionDraft'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{
  question: QuizQuestionAuthor
  draft: EditableQuestion
  number: number
  busy: string | null
  dirty: boolean
  autosaving: boolean
}>()

const emit = defineEmits<{
  patch: [changes: Partial<EditableQuestion>]
  toggleCorrect: [index: number]
  setOption: [index: number, value: string]
  addOption: []
  removeOption: [index: number]
  attach: [file: File]
  detach: [assetId: string]
  remove: []
}>()

const QUESTION_TYPE_VALUES: QuestionType[] = [
  'single',
  'multiple',
  'text',
  'matching',
  'grouping',
  'file',
]
const QUESTION_TYPES = computed(() =>
  QUESTION_TYPE_VALUES.map((value) => ({ value, label: t(`quizEditor.types.${value}`) })),
)

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
        :aria-label="t('quizEditor.prompt')"
        @input="emit('patch', { promptMd: inputValue($event) })"
      />
      <AppSelect
        :model-value="draft.type"
        :options="QUESTION_TYPES"
        :label="t('quizEditor.type')"
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
          :aria-label="t('quizEditor.correctOption', { number: index + 1 })"
          @click="emit('toggleCorrect', index)"
        >
          ✓
        </button>
        <input
          class="option-input"
          :value="option"
          :aria-label="t('quizEditor.option', { number: index + 1 })"
          @input="emit('setOption', index, inputValue($event))"
        />
        <AppButton size="sm" variant="quiet" @click="emit('removeOption', index)">
          {{ t('manage.remove') }}
        </AppButton>
      </div>
      <AppButton size="sm" variant="quiet" @click="emit('addOption')">{{
        t('quizEditor.addOption')
      }}</AppButton>
    </div>

    <div v-else-if="draft.type === 'text'" class="accepted">
      <label class="label" :for="`accepted-${question.id}`">
        {{ t('quizEditor.acceptedAnswers') }}
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
        <Label :for="`case-${question.id}`" class="case-label">{{
          t('quizEditor.caseSensitive')
        }}</Label>
      </div>
    </div>

    <InteractionBlockEditor
      v-else-if="draft.type === 'matching' || draft.type === 'grouping'"
      :type="draft.type"
      :lines="draft.interactionLines"
      @change="(interactionLines) => emit('patch', { interactionLines })"
    />

    <p v-else class="file-note">
      {{ t('quizEditor.fileHint') }}
    </p>

    <div class="attachments">
      <span class="label">{{ t('quizEditor.materials') }}</span>
      <span v-for="asset in draft.attachments" :key="asset.id" class="attachment">
        <a :href="asset.url" target="_blank" rel="noopener">{{ asset.filename }}</a>
        <button type="button" class="attachment-remove" @click="emit('detach', asset.id)">×</button>
      </span>
      <label class="attachment-add">
        {{ t('quizEditor.attachFile') }}
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
      :placeholder="t('quizEditor.explanation')"
      :aria-label="t('quizEditor.explanationLabel')"
      @input="emit('patch', { explainMd: inputValue($event) })"
    />

    <div class="question-actions">
      <span v-if="autosaving" class="save-state">{{ t('manage.saving') }}</span>
      <span v-else-if="dirty" class="save-state">{{ t('manage.autosave') }}</span>
      <span v-else class="save-state saved">{{ t('manage.saved') }}</span>
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
  justify-content: space-between;
  padding-left: var(--space-8);
}

.save-state {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.save-state.saved {
  color: var(--success);
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

<script setup lang="ts">
import { Label } from 'reka-ui'

import type { QuestionType } from '@/api/schemas/common'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useQuizEditor } from '@/features/quiz-editor/composables/useQuizEditor'

const props = defineProps<{ quiz: string }>()

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'один ответ' },
  { value: 'multiple', label: 'несколько' },
  { value: 'text', label: 'текст' },
  { value: 'matching', label: 'связывание' },
  { value: 'grouping', label: 'по блокам' },
  { value: 'file', label: 'файл + самопроверка' },
]

const {
  loaded,
  lessonOptions,
  boundLesson,
  bindTo,
  pending,
  error,
  busy,
  draftOf,
  patch,
  toggleCorrect,
  setOption,
  addOption,
  removeOption,
  attachFile,
  detachFile,
  save,
  add,
  remove,
  togglePublished,
} = useQuizEditor(() => props.quiz)

function pickAttachment(questionId: string, event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void attachFile(questionId, file)
  input.value = ''
}
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <section v-if="loaded">
      <header class="head">
        <h1 class="title">{{ loaded.title }}</h1>
        <StatusChip :status="loaded.status" />
        <AppSelect
          :model-value="boundLesson"
          :options="lessonOptions"
          label="Тема теста"
          :disabled="busy === 'quiz'"
          @update:model-value="bindTo"
        />
        <div class="head-actions">
          <AppButton size="sm" :loading="busy === 'quiz'" @click="togglePublished">
            {{ loaded.status === 'published' ? 'снять с публикации' : 'опубликовать' }}
          </AppButton>
          <RouterLink :to="{ name: 'manage-content' }" class="back">← к списку</RouterLink>
        </div>
      </header>

      <p v-if="loaded.questions.length === 0" class="empty">в тесте пока нет вопросов</p>

      <ol class="questions">
        <li v-for="(question, index) in loaded.questions" :key="question.id" class="question">
          <template v-if="draftOf(question.id)">
            <div class="question-head">
              <span class="index">{{ index + 1 }}</span>
              <input
                class="prompt"
                :value="draftOf(question.id)?.promptMd"
                aria-label="Текст вопроса"
                @input="
                  patch(question.id, {
                    promptMd: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <AppSelect
                v-if="draftOf(question.id)"
                :model-value="draftOf(question.id)!.type"
                :options="TYPES"
                label="Тип вопроса"
                @update:model-value="(type) => patch(question.id, { type })"
              />
            </div>

            <div
              v-if="['single', 'multiple'].includes(draftOf(question.id)?.type ?? '')"
              class="options"
            >
              <div
                v-for="(option, at) in draftOf(question.id)?.options ?? []"
                :key="at"
                class="option"
              >
                <button
                  type="button"
                  class="pick"
                  :class="{ 'pick--on': draftOf(question.id)?.correct.includes(at) }"
                  :aria-pressed="draftOf(question.id)?.correct.includes(at)"
                  :aria-label="`Верный вариант ${String(at + 1)}`"
                  @click="toggleCorrect(question.id, at)"
                >
                  ✓
                </button>
                <input
                  class="option-input"
                  :value="option"
                  :aria-label="`Вариант ${String(at + 1)}`"
                  @input="setOption(question.id, at, ($event.target as HTMLInputElement).value)"
                />
                <AppButton size="sm" variant="quiet" @click="removeOption(question.id, at)">
                  убрать
                </AppButton>
              </div>
              <AppButton size="sm" variant="quiet" @click="addOption(question.id)">
                + вариант
              </AppButton>
            </div>

            <div v-else-if="draftOf(question.id)?.type === 'text'" class="accepted">
              <label class="label" :for="`accepted-${question.id}`">
                принимаемые ответы, по одному в строке
              </label>
              <textarea
                :id="`accepted-${question.id}`"
                class="accepted-input"
                :value="draftOf(question.id)?.accepted.join('\n')"
                rows="3"
                @input="
                  patch(question.id, {
                    accepted: ($event.target as HTMLTextAreaElement).value.split('\n'),
                  })
                "
              ></textarea>
              <div class="case">
                <AppCheckbox
                  :id="`case-${question.id}`"
                  :model-value="draftOf(question.id)?.caseSensitive === true"
                  @update:model-value="(value) => patch(question.id, { caseSensitive: value })"
                />
                <Label :for="`case-${question.id}`" class="case-label">учитывать регистр</Label>
              </div>
            </div>

            <div
              v-else-if="['matching', 'grouping'].includes(draftOf(question.id)?.type ?? '')"
              class="accepted"
            >
              <label class="label" :for="`interaction-${question.id}`">
                {{
                  draftOf(question.id)?.type === 'matching'
                    ? 'пары, по одной в строке: понятие = соответствие'
                    : 'блоки: категория: элемент 1, элемент 2'
                }}
              </label>
              <textarea
                :id="`interaction-${question.id}`"
                class="accepted-input"
                :value="draftOf(question.id)?.interactionLines.join('\n')"
                rows="5"
                @input="
                  patch(question.id, {
                    interactionLines: ($event.target as HTMLTextAreaElement).value.split('\n'),
                  })
                "
              ></textarea>
            </div>

            <p v-else class="file-note">
              Студент прикрепит изображение или PDF и сам отметит задание выполненным.
            </p>

            <div class="attachments">
              <span class="label">материалы к заданию</span>
              <span
                v-for="asset in draftOf(question.id)?.attachments ?? []"
                :key="asset.id"
                class="attachment"
              >
                <a :href="asset.url" target="_blank" rel="noopener">{{ asset.filename }}</a>
                <button
                  type="button"
                  class="attachment-remove"
                  @click="detachFile(question.id, asset.id)"
                >
                  ×
                </button>
              </span>
              <label class="attachment-add">
                + прикрепить файл
                <input
                  class="visually-hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                  :disabled="busy === `attachment-${question.id}`"
                  @change="pickAttachment(question.id, $event)"
                />
              </label>
            </div>

            <input
              class="explain"
              :value="draftOf(question.id)?.explainMd"
              placeholder="разбор, показывается после ответа"
              aria-label="Разбор"
              @input="patch(question.id, { explainMd: ($event.target as HTMLInputElement).value })"
            />

            <div class="question-actions">
              <AppButton
                size="sm"
                variant="primary"
                :loading="busy === question.id"
                @click="save(question)"
              >
                сохранить вопрос
              </AppButton>
              <ConfirmButton :loading="busy === question.id" @confirm="remove(question.id)" />
            </div>
          </template>
        </li>
      </ol>

      <AppButton variant="secondary" :loading="busy === 'new'" @click="add"> + вопрос </AppButton>
    </section>
  </LoadState>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.title {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-left: auto;
}

.back {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.back:hover {
  color: var(--text);
}

.questions {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.question {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.question-head {
  display: flex;
  align-items: center;
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
  font-size: var(--text-body);
}

.prompt {
  flex: 1;
  min-width: 0;
  font-weight: var(--weight-medium);
}

.explain,
.option-input,
.accepted-input {
  font-size: var(--text-caption);
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

.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  padding-left: var(--space-8);
}

.option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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
  line-height: 1;
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.pick--on {
  background: var(--success);
  border-color: var(--success);
  color: var(--on-success);
}

.accepted {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: var(--space-8);
}

.file-note,
.attachments {
  margin-left: var(--space-8);
}

.file-note {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.attachments {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
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

.label,
.case-label {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.case {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.case-label {
  cursor: pointer;
}

.question-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-left: var(--space-8);
}

.empty {
  padding: var(--space-8) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

<script setup lang="ts">
import { Label, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { computed, ref } from 'vue'

import { uploadAsset } from '@/api/assets'
import { assetMimeSchema, type Asset } from '@/api/schemas/assets'
import type { Quiz, QuizQuestion } from '@/api/schemas/content'
import type { QuizAttempt } from '@/api/schemas/learning'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import {
  groupedItems as itemsInGroup,
  interactionAnswer,
  interactiveOptions,
  matchingLabel as labelForMatch,
  placeGrouping,
  placeMatching,
  unplacedItems,
} from '@/features/quiz-runner/model/interactions'
import { normalizeOptions } from './options'

const props = defineProps<{ quiz: Quiz; submitting: boolean; attempt: QuizAttempt | null }>()
const emit = defineEmits<{ submit: [answers: Record<string, unknown>] }>()

const single = ref<Record<string, string>>({})
const multiple = ref<Record<string, unknown[]>>({})
const text = ref<Record<string, string>>({})
const placements = ref<Record<string, Record<string, string>>>({})
const fileAnswers = ref<Record<string, Asset>>({})
const confirmed = ref<Record<string, boolean>>({})
const uploading = ref<string | null>(null)
const uploadError = ref<Record<string, string>>({})
const dragged = ref<{ questionId: string; itemId: string } | null>(null)

const optionsByQuestion = computed(
  () => new Map(props.quiz.questions.map((q) => [q.id, normalizeOptions(q.options)])),
)

const resultsById = computed(
  () => new Map((props.attempt?.results ?? []).map((item) => [item.questionId, item])),
)

const isReviewing = computed(() => props.attempt !== null)

function optionsOf(questionId: string) {
  return optionsByQuestion.value.get(questionId) ?? []
}

function selectedOptionValue(questionId: string): unknown {
  const key = single.value[questionId]
  return optionsOf(questionId).find((option) => option.key === key)?.value
}

function selectSingle(questionId: string, value: unknown): void {
  single.value = { ...single.value, [questionId]: typeof value === 'string' ? value : '' }
}

function isChecked(questionId: string, key: string): boolean {
  return (multiple.value[questionId] ?? []).includes(key)
}

function toggle(questionId: string, key: string, checked: boolean): void {
  const current = multiple.value[questionId] ?? []
  multiple.value = {
    ...multiple.value,
    [questionId]: checked ? [...current, key] : current.filter((item) => item !== key),
  }
}

function startDrag(questionId: string, itemId: string): void {
  dragged.value = { questionId, itemId }
}

function dropMatching(questionId: string, leftId: string): void {
  const current = dragged.value
  if (!current || current.questionId !== questionId || isReviewing.value) return
  const mapping = placeMatching(placements.value[questionId] ?? {}, current.itemId, leftId)
  placements.value = { ...placements.value, [questionId]: mapping }
  dragged.value = null
}

function dropGrouping(questionId: string, groupId: string): void {
  const current = dragged.value
  if (!current || current.questionId !== questionId || isReviewing.value) return
  placements.value = {
    ...placements.value,
    [questionId]: placeGrouping(placements.value[questionId] ?? {}, current.itemId, groupId),
  }
  dragged.value = null
}

function matchingLabel(question: QuizQuestion, leftId: string): string | null {
  return labelForMatch(question, placements.value[question.id] ?? {}, leftId)
}

function groupedItems(question: QuizQuestion, groupId: string) {
  return itemsInGroup(question, placements.value[question.id] ?? {}, groupId)
}

function unplaced(question: QuizQuestion, kind: 'right' | 'item') {
  // Авторский порядок кодирует правильные пары/группы; студенту его не показываем.
  return unplacedItems(question, placements.value[question.id] ?? {}, kind)
}

async function pickFile(questionId: string, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const mime = assetMimeSchema.safeParse(file.type)
  if (!mime.success) {
    uploadError.value = {
      ...uploadError.value,
      [questionId]: 'Можно загрузить изображение или PDF',
    }
    return
  }
  uploading.value = questionId
  uploadError.value = { ...uploadError.value, [questionId]: '' }
  try {
    const asset = await uploadAsset(file, mime.data)
    fileAnswers.value = { ...fileAnswers.value, [questionId]: asset }
  } catch {
    uploadError.value = { ...uploadError.value, [questionId]: 'Не удалось загрузить файл' }
  } finally {
    uploading.value = null
  }
}

function collect(): Record<string, unknown> {
  const answers: Record<string, unknown> = {}
  for (const question of props.quiz.questions) {
    if (question.type === 'single') {
      const value = selectedOptionValue(question.id)
      if (value !== undefined) {
        answers[question.id] = value
      }
    } else if (question.type === 'multiple') {
      const keys = multiple.value[question.id] ?? []
      answers[question.id] = optionsOf(question.id)
        .filter((option) => keys.includes(option.key))
        .map((option) => option.value)
    } else if (question.type === 'text') {
      const value = text.value[question.id]
      if (value !== undefined && value.trim() !== '') {
        answers[question.id] = value
      }
    } else if (question.type === 'matching') {
      answers[question.id] = interactionAnswer('matching', placements.value[question.id] ?? {})
    } else if (question.type === 'grouping') {
      answers[question.id] = interactionAnswer('grouping', placements.value[question.id] ?? {})
    } else {
      const asset = fileAnswers.value[question.id]
      if (asset) {
        answers[question.id] = {
          asset_id: asset.id,
          confirmed: confirmed.value[question.id] === true,
        }
      }
    }
  }
  return answers
}
</script>

<template>
  <form class="quiz" @submit.prevent="emit('submit', collect())">
    <ol class="questions">
      <li v-for="(question, index) in props.quiz.questions" :key="question.id" class="question">
        <div class="prompt">
          <span class="index">{{ index + 1 }}</span>
          <p class="prompt-text">{{ question.promptMd }}</p>
        </div>

        <div v-if="question.attachments.length" class="materials">
          <span class="materials-label">материалы:</span>
          <a
            v-for="asset in question.attachments"
            :key="asset.id"
            :href="asset.url"
            target="_blank"
            rel="noopener"
          >
            {{ asset.filename }}
          </a>
        </div>

        <RadioGroupRoot
          v-if="question.type === 'single'"
          :model-value="single[question.id] ?? ''"
          class="options"
          :disabled="isReviewing"
          @update:model-value="(value) => selectSingle(question.id, value)"
        >
          <div v-for="option in optionsOf(question.id)" :key="option.key" class="option">
            <RadioGroupItem :id="`${question.id}-${option.key}`" :value="option.key" class="radio">
              <span class="radio-dot" />
            </RadioGroupItem>
            <Label :for="`${question.id}-${option.key}`" class="option-label">
              {{ option.label }}
            </Label>
          </div>
        </RadioGroupRoot>

        <div v-else-if="question.type === 'multiple'" class="options">
          <div v-for="option in optionsOf(question.id)" :key="option.key" class="option">
            <AppCheckbox
              :id="`${question.id}-${option.key}`"
              :model-value="isChecked(question.id, option.key)"
              :disabled="isReviewing"
              @update:model-value="(value) => toggle(question.id, option.key, value)"
            />
            <Label :for="`${question.id}-${option.key}`" class="option-label">
              {{ option.label }}
            </Label>
          </div>
        </div>

        <input
          v-else-if="question.type === 'text'"
          v-model="text[question.id]"
          class="text-input"
          type="text"
          :disabled="isReviewing"
          placeholder="ответ"
        />

        <div v-else-if="question.type === 'matching'" class="interaction">
          <div class="token-pool">
            <span
              v-for="item in unplaced(question, 'right')"
              :key="item.id"
              class="drag-token"
              :draggable="!isReviewing"
              @dragstart="startDrag(question.id, item.id)"
              @click="startDrag(question.id, item.id)"
            >
              {{ item.label }}
            </span>
          </div>
          <div
            v-for="left in interactiveOptions(question, 'left')"
            :key="left.id"
            class="match-row"
          >
            <span>{{ left.label }}</span>
            <span
              class="drop-zone"
              @dragover.prevent
              @drop.prevent="dropMatching(question.id, left.id)"
              @click="dropMatching(question.id, left.id)"
            >
              {{ matchingLabel(question, left.id) ?? 'перетащите соответствие' }}
            </span>
          </div>
        </div>

        <div v-else-if="question.type === 'grouping'" class="interaction">
          <div class="token-pool">
            <span
              v-for="item in unplaced(question, 'item')"
              :key="item.id"
              class="drag-token"
              :draggable="!isReviewing"
              @dragstart="startDrag(question.id, item.id)"
              @click="startDrag(question.id, item.id)"
            >
              {{ item.label }}
            </span>
          </div>
          <div class="group-grid">
            <section
              v-for="group in interactiveOptions(question, 'group')"
              :key="group.id"
              class="group-zone"
              @dragover.prevent
              @drop.prevent="dropGrouping(question.id, group.id)"
              @click="dropGrouping(question.id, group.id)"
            >
              <strong>{{ group.label }}</strong>
              <span
                v-for="item in groupedItems(question, group.id)"
                :key="item.id"
                class="drag-token"
                :draggable="!isReviewing"
                @dragstart="startDrag(question.id, item.id)"
                @click="startDrag(question.id, item.id)"
              >
                {{ item.label }}
              </span>
            </section>
          </div>
        </div>

        <div v-else class="file-answer">
          <label class="file-picker">
            {{ fileAnswers[question.id]?.filename ?? 'прикрепить изображение или PDF' }}
            <input
              class="visually-hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              :disabled="isReviewing || uploading === question.id"
              @change="pickFile(question.id, $event)"
            />
          </label>
          <label v-if="fileAnswers[question.id]" class="self-check">
            <AppCheckbox
              :id="`confirmed-${question.id}`"
              :model-value="confirmed[question.id] === true"
              :disabled="isReviewing"
              @update:model-value="(value) => (confirmed[question.id] = value)"
            />
            считаю задание выполненным
          </label>
          <span v-if="uploadError[question.id]" class="upload-error">
            {{ uploadError[question.id] }}
          </span>
        </div>

        <p
          v-if="resultsById.get(question.id)"
          class="verdict"
          :class="resultsById.get(question.id)?.correct ? 'verdict--ok' : 'verdict--bad'"
        >
          {{ resultsById.get(question.id)?.correct ? 'верно' : 'неверно' }}
          <span v-if="resultsById.get(question.id)?.explanation" class="explain">
            — {{ resultsById.get(question.id)?.explanation }}
          </span>
        </p>
      </li>
    </ol>

    <AppButton v-if="!isReviewing" type="submit" variant="primary" :loading="props.submitting">
      проверить
    </AppButton>
  </form>
</template>

<style scoped>
.questions {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: var(--measure);
  margin-bottom: var(--space-8);
}

.prompt {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.index {
  flex-shrink: 0;
  width: var(--space-6);
  color: var(--text-muted);
  font-size: var(--text-caption);
  line-height: 1.7;
}

.prompt-text {
  font-weight: var(--weight-medium);
}

.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: var(--space-8);
}

.option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.radio {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-4);
  height: var(--space-4);
  padding: 0;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--card);
  cursor: pointer;
}

.radio[data-state='checked'] {
  border-color: var(--accent);
  background: var(--accent);
}

.radio-dot {
  width: var(--space-1);
  height: var(--space-1);
  border-radius: var(--radius-pill);
  background: var(--on-accent);
  opacity: 0;
}

.radio[data-state='checked'] .radio-dot {
  opacity: 1;
}

.option-label {
  cursor: pointer;
}

.text-input {
  width: 100%;
  max-width: 360px;
  margin-left: var(--space-8);
  height: var(--ctl-md);
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

.materials,
.interaction,
.file-answer {
  margin-left: var(--space-8);
}

.materials {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--text-caption);
}

.materials-label {
  color: var(--text-muted);
}

.interaction,
.file-answer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.token-pool,
.group-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.drag-token,
.drop-zone,
.group-zone,
.file-picker {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

.drag-token,
.file-picker {
  cursor: grab;
}

.match-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 1fr);
  align-items: center;
  gap: var(--space-3);
}

.drop-zone {
  min-height: var(--ctl-md);
  color: var(--text-muted);
}

.group-zone {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 120px;
}

.file-picker {
  align-self: flex-start;
  color: var(--accent);
}

.self-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-caption);
}

.upload-error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.verdict {
  margin-top: var(--space-3);
  padding-left: var(--space-8);
  font-size: var(--text-caption);
}

.verdict--ok {
  color: var(--success);
}

.verdict--bad {
  color: var(--danger);
}

.explain {
  color: var(--text-muted);
}
</style>

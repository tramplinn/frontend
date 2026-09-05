<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { suggestAuthoringChanges } from '@/api/teacherAssistant'
import type {
  TeacherAssistantDocument,
  TeacherAssistantPatch,
  TeacherAssistantSurface,
} from '@/api/schemas/teacherAssistant'
import AppButton from '@/components/ui/AppButton.vue'
import { useFloatingPanel } from '@/composables/useFloatingPanel'
import { errorText } from '@/lib/errors'

const props = defineProps<{
  surface: TeacherAssistantSurface
  document: TeacherAssistantDocument
}>()

const emit = defineEmits<{ apply: [patch: TeacherAssistantPatch] }>()

const { isOpen: open, open: openPanel, close: closePanel } = useFloatingPanel('assistant')
const instruction = ref('')
const pending = ref(false)
const error = ref<string | null>(null)
const log = ref<HTMLElement | null>(null)

const prompts = computed(() =>
  props.surface === 'lesson'
    ? ['сделай понятнее', 'исправь ошибки', 'добавь примеры']
    : ['оформи условие', 'проверь однозначность', 'добавь ограничения'],
)

const fieldLabels: Record<keyof Omit<TeacherAssistantPatch, 'explanation'>, string> = {
  title: 'название',
  bodyMd: 'текст урока',
  statementMd: 'условие',
  difficulty: 'сложность',
  tags: 'темы',
  timeLimitMs: 'лимит времени',
  memoryLimitKb: 'лимит памяти',
}

type PatchField = keyof typeof fieldLabels
type DiffKind = 'same' | 'remove' | 'add'

interface DiffLine {
  kind: DiffKind
  text: string
}

interface UserTurn {
  role: 'user'
  content: string
}

interface AssistantTurn {
  role: 'assistant'
  suggestion: TeacherAssistantPatch
}

type ChatTurn = UserTurn | AssistantTurn

const turns = ref<ChatTurn[]>([])

const patchFields = Object.keys(fieldLabels) as PatchField[]

function textOf(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return ''
}

/** Линейный diff сохраняет общий контекст сверху и снизу. Большой переписанный
    фрагмент остаётся двумя цельными блоками и не подвешивает браузер на длинном уроке. */
function diffLines(beforeValue: unknown, afterValue: unknown): DiffLine[] {
  const before = textOf(beforeValue).split('\n')
  const after = textOf(afterValue).split('\n')
  let prefix = 0
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) {
    prefix += 1
  }
  let suffix = 0
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - suffix - 1] === after[after.length - suffix - 1]
  ) {
    suffix += 1
  }

  return [
    ...before.slice(0, prefix).map((text) => ({ kind: 'same' as const, text })),
    ...before
      .slice(prefix, before.length - suffix)
      .map((text) => ({ kind: 'remove' as const, text })),
    ...after.slice(prefix, after.length - suffix).map((text) => ({ kind: 'add' as const, text })),
    ...(suffix === 0
      ? []
      : before.slice(before.length - suffix).map((text) => ({ kind: 'same' as const, text }))),
  ]
}

function changesFor(turn: AssistantTurn) {
  const current = turn.suggestion
  return patchFields
    .filter(
      (field) =>
        current[field] !== null && textOf(current[field]) !== textOf(props.document[field]),
    )
    .map((field) => ({
      field,
      label: fieldLabels[field],
      lines: diffLines(props.document[field], current[field]),
    }))
}

function setLog(element: Element | ComponentPublicInstance | null): void {
  log.value = element instanceof HTMLElement ? element : null
}

function scrollToEnd(): void {
  void nextTick(() => {
    if (log.value) log.value.scrollTop = log.value.scrollHeight
  })
}

async function ask(text = instruction.value): Promise<void> {
  const request = text.trim()
  if (!request || pending.value) return
  instruction.value = ''
  pending.value = true
  error.value = null
  turns.value.push({ role: 'user', content: request })
  scrollToEnd()
  try {
    const suggestion = await suggestAuthoringChanges(props.surface, request, props.document)
    turns.value.push({ role: 'assistant', suggestion })
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    pending.value = false
    scrollToEnd()
  }
}

function patchFor(turn: AssistantTurn, fields: PatchField[]): TeacherAssistantPatch {
  const current = turn.suggestion
  const has = (field: PatchField): boolean => fields.includes(field)
  return {
    explanation: current.explanation,
    title: has('title') ? current.title : null,
    bodyMd: has('bodyMd') ? current.bodyMd : null,
    statementMd: has('statementMd') ? current.statementMd : null,
    difficulty: has('difficulty') ? current.difficulty : null,
    tags: has('tags') ? current.tags : null,
    timeLimitMs: has('timeLimitMs') ? current.timeLimitMs : null,
    memoryLimitKb: has('memoryLimitKb') ? current.memoryLimitKb : null,
  }
}

function applyOneFor(turn: AssistantTurn, field: PatchField): void {
  emit('apply', patchFor(turn, [field]))
  discardFor(turn, field)
}

function discardFor(turn: AssistantTurn, field: PatchField): void {
  turn.suggestion = { ...turn.suggestion, [field]: null }
}

function applyAllFor(turn: AssistantTurn): void {
  const fields = changesFor(turn).map((change) => change.field)
  emit('apply', patchFor(turn, fields))
  turn.suggestion = {
    ...turn.suggestion,
    ...Object.fromEntries(fields.map((field) => [field, null])),
  }
}
</script>

<template>
  <div class="assistant-widget">
    <button
      v-if="!open"
      type="button"
      class="assistant-tab"
      aria-label="Открыть помощника"
      title="Помощник"
      @click="openPanel"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z" fill="currentColor" />
      </svg>
    </button>

    <Transition name="assistant-drawer">
      <section v-if="open" class="chat" aria-label="Помощник преподавателя">
        <header class="head">
          <div class="bar">
            <span class="title">помощник</span>
            <span class="hint">предложит правки, а примените их вы</span>
          </div>
          <button type="button" class="control close" aria-label="Закрыть" @click="closePanel">
            ×
          </button>
        </header>

        <div :ref="setLog" class="log">
          <template v-for="(turn, index) in turns" :key="index">
            <div v-if="turn.role === 'user'" class="turn turn--user">{{ turn.content }}</div>

            <div v-else class="turn turn--assistant">
              <p class="explanation">{{ turn.suggestion.explanation }}</p>
              <p v-if="changesFor(turn).length === 0" class="muted">Изменений не требуется.</p>
              <article v-for="change in changesFor(turn)" :key="change.field" class="change">
                <header class="change-head">
                  <strong>{{ change.label }}</strong>
                  <span class="change-actions">
                    <button type="button" class="reject" @click="discardFor(turn, change.field)">
                      отклонить
                    </button>
                    <button type="button" class="accept" @click="applyOneFor(turn, change.field)">
                      принять
                    </button>
                  </span>
                </header>
                <div class="diff" role="region" :aria-label="`Изменения поля ${change.label}`">
                  <div
                    v-for="(line, lineIndex) in change.lines"
                    :key="lineIndex"
                    class="diff-line"
                    :class="`diff-line--${line.kind}`"
                  >
                    <span aria-hidden="true">{{
                      line.kind === 'remove' ? '−' : line.kind === 'add' ? '+' : ' '
                    }}</span>
                    <code>{{ line.text || ' ' }}</code>
                  </div>
                </div>
              </article>
              <AppButton
                v-if="changesFor(turn).length > 1"
                size="sm"
                variant="primary"
                @click="applyAllFor(turn)"
              >
                применить всё
              </AppButton>
            </div>
          </template>

          <p v-if="pending" class="waiting">думает…</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </div>

        <div v-if="turns.length === 0" class="quick-actions">
          <button v-for="prompt in prompts" :key="prompt" type="button" @click="ask(prompt)">
            {{ prompt }}
          </button>
        </div>

        <form class="composer" @submit.prevent="ask()">
          <div class="composer-box">
            <textarea
              v-model="instruction"
              rows="3"
              maxlength="4000"
              placeholder="Например: перепиши вступление проще и добавь пример"
              aria-label="Что изменить"
              :disabled="pending"
              @keydown.enter.exact.prevent="ask()"
            ></textarea>
          </div>
          <div class="composer-footer">
            <AppButton
              type="submit"
              size="sm"
              variant="primary"
              :loading="pending"
              :disabled="!instruction.trim()"
            >
              отправить
            </AppButton>
          </div>
        </form>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.assistant-tab {
  position: fixed;
  z-index: 50;
  top: 50%;
  right: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 132px;
  border: 1px solid var(--accent);
  border-right: 0;
  border-radius: var(--radius-ctl) 0 0 var(--radius-ctl);
  background: var(--accent);
  box-shadow: var(--shadow-raised);
  color: var(--on-accent);
  cursor: pointer;
  transform: translateY(-50%);
  transition: width var(--motion-fast) var(--ease);
}

.assistant-tab:hover {
  width: 34px;
  background: var(--accent-hover);
}

.chat {
  position: fixed;
  z-index: 50;
  top: 50%;
  right: 0;
  display: flex;
  flex-direction: column;
  width: min(420px, 100vw);
  height: calc(100dvh - var(--space-6));
  min-height: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-right: 0;
  border-radius: var(--radius-card) 0 0 var(--radius-card);
  box-shadow: var(--shadow-raised);
  overflow: hidden;
  transform: translateY(-50%);
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 0 0 auto;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.bar {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.title {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
}

.hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.control {
  flex: 0 0 auto;
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-title);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.control:hover {
  background: var(--surface);
  color: var(--text);
}

.log {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--space-4);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.turn {
  font-size: var(--text-caption);
  line-height: 1.6;
}

.turn--user {
  align-self: flex-end;
  max-width: 85%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.turn--assistant {
  display: grid;
  gap: var(--space-3);
}

.explanation {
  line-height: 1.6;
}

.muted {
  color: var(--text-muted);
}

.waiting {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.change {
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  overflow: hidden;
}

.change-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
}

.change-head strong {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.change-actions {
  display: flex;
  gap: var(--space-2);
}

.change-actions button {
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
}

.reject {
  color: var(--danger);
}

.accept {
  color: var(--success);
}

.change-actions button:hover {
  background: var(--surface);
}

.diff {
  max-height: 240px;
  overflow: auto;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.diff-line {
  display: grid;
  grid-template-columns: var(--space-5) minmax(0, 1fr);
  min-height: 1.6em;
  padding: 0 var(--space-3);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: var(--text-caption);
}

.diff-line > span {
  user-select: none;
}

.diff-line--same {
  color: var(--text-muted);
}

.diff-line--remove {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  color: var(--danger);
}

.diff-line--add {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}

.quick-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0 var(--space-4) var(--space-3);
}

.quick-actions button {
  padding: var(--space-2) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font: inherit;
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.quick-actions button:hover {
  background: var(--accent);
  color: var(--on-accent);
}

.composer {
  display: grid;
  gap: var(--space-2);
  flex: 0 0 auto;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
}

.composer-footer {
  display: flex;
  justify-content: flex-end;
}

.composer-box {
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--bg);
  transition: border-color var(--motion-fast) var(--ease);
}

.composer-box:focus-within {
  border-color: var(--accent);
}

.composer textarea {
  width: 100%;
  padding: var(--space-3);
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  line-height: 1.5;
  resize: none;
}

.composer textarea:focus {
  outline: none;
}

.assistant-drawer-enter-active,
.assistant-drawer-leave-active {
  transition:
    transform var(--motion-base) var(--ease),
    opacity var(--motion-fast) var(--ease);
}

.assistant-drawer-enter-from,
.assistant-drawer-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(100%);
}

@media (max-width: 600px) {
  .chat {
    inset: 0;
    width: 100vw;
    height: 100dvh;
    border: 0;
    border-radius: 0;
    transform: none;
  }

  .assistant-drawer-enter-from,
  .assistant-drawer-leave-to {
    transform: translateX(100%);
  }

  .head {
    padding-top: max(var(--space-3), env(safe-area-inset-top));
  }

  .composer {
    padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { suggestAuthoringChanges } from '@/api/teacherAssistant'
import type {
  TeacherAssistantDocument,
  TeacherAssistantPatch,
  TeacherAssistantSurface,
} from '@/api/schemas/teacherAssistant'
import AppButton from '@/components/ui/AppButton.vue'
import { errorText } from '@/lib/errors'

const props = defineProps<{
  surface: TeacherAssistantSurface
  document: TeacherAssistantDocument
}>()

const emit = defineEmits<{ apply: [patch: TeacherAssistantPatch] }>()

const open = ref(false)
const instruction = ref('')
const pending = ref(false)
const error = ref<string | null>(null)
const suggestion = ref<TeacherAssistantPatch | null>(null)

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
  topics: 'темы',
  timeLimitMs: 'лимит времени',
  memoryLimitKb: 'лимит памяти',
}

type PatchField = keyof typeof fieldLabels
type DiffKind = 'same' | 'remove' | 'add'

interface DiffLine {
  kind: DiffKind
  text: string
}

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

const changes = computed(() => {
  const current = suggestion.value
  if (!current) return []
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
})

async function ask(text = instruction.value): Promise<void> {
  const request = text.trim()
  if (!request || pending.value) return
  instruction.value = request
  pending.value = true
  error.value = null
  suggestion.value = null
  try {
    suggestion.value = await suggestAuthoringChanges(props.surface, request, props.document)
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    pending.value = false
  }
}

function patchFor(fields: PatchField[]): TeacherAssistantPatch | null {
  const current = suggestion.value
  if (!current) return null
  const has = (field: PatchField): boolean => fields.includes(field)
  return {
    explanation: current.explanation,
    title: has('title') ? current.title : null,
    bodyMd: has('bodyMd') ? current.bodyMd : null,
    statementMd: has('statementMd') ? current.statementMd : null,
    difficulty: has('difficulty') ? current.difficulty : null,
    topics: has('topics') ? current.topics : null,
    timeLimitMs: has('timeLimitMs') ? current.timeLimitMs : null,
    memoryLimitKb: has('memoryLimitKb') ? current.memoryLimitKb : null,
  }
}

function applyOne(field: PatchField): void {
  const patch = patchFor([field])
  if (patch) emit('apply', patch)
  discard(field)
}

function discard(field: PatchField): void {
  const current = suggestion.value
  if (!current) return
  if (changes.value.length <= 1) {
    suggestion.value = null
    return
  }
  suggestion.value = { ...current, [field]: null }
}

function applyAll(): void {
  const patch = patchFor(changes.value.map((change) => change.field))
  if (patch) emit('apply', patch)
  suggestion.value = null
  instruction.value = ''
}
</script>

<template>
  <div class="assistant-widget">
    <button v-if="!open" type="button" class="assistant-tab" @click="open = true">
      <span aria-hidden="true">✦</span>
      помощник
    </button>

    <Transition name="assistant-drawer">
      <aside v-if="open" class="drawer" aria-label="Помощник преподавателя">
        <header class="drawer-head">
          <div>
            <h2><span aria-hidden="true">✦</span> помощник</h2>
            <p>Предложит правки, а примените их вы.</p>
          </div>
          <button type="button" class="close" aria-label="Закрыть" @click="open = false">×</button>
        </header>

        <div class="quick-actions">
          <button v-for="prompt in prompts" :key="prompt" type="button" @click="ask(prompt)">
            {{ prompt }}
          </button>
        </div>

        <form class="composer" @submit.prevent="ask()">
          <textarea
            v-model="instruction"
            rows="4"
            maxlength="4000"
            placeholder="Например: перепиши вступление проще и добавь пример"
            aria-label="Что изменить"
          ></textarea>
          <AppButton type="submit" :loading="pending" :disabled="!instruction.trim()">
            предложить правки
          </AppButton>
        </form>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <section v-if="suggestion" class="suggestion">
          <p>{{ suggestion.explanation }}</p>
          <p v-if="changes.length === 0" class="muted">Изменений не требуется.</p>
          <article v-for="change in changes" :key="change.field" class="change">
            <header class="change-head">
              <strong>{{ change.label }}</strong>
              <span class="change-actions">
                <button type="button" class="reject" @click="discard(change.field)">
                  отклонить
                </button>
                <button type="button" class="accept" @click="applyOne(change.field)">
                  принять
                </button>
              </span>
            </header>
            <div class="diff" role="region" :aria-label="`Изменения поля ${change.label}`">
              <div
                v-for="(line, index) in change.lines"
                :key="index"
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
          <AppButton v-if="changes.length > 1" variant="primary" @click="applyAll">
            применить всё
          </AppButton>
        </section>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
.assistant-widget {
  position: fixed;
  z-index: 50;
  right: 0;
  bottom: calc(var(--ctl-sm) + var(--space-3));
}

.assistant-tab {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: 1px solid var(--accent);
  border-right: 0;
  border-radius: var(--radius-ctl) 0 0 var(--radius-ctl);
  background: var(--accent);
  box-shadow: var(--shadow-raised);
  color: var(--on-accent);
  font: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
}

.drawer {
  width: min(440px, 100vw);
  max-height: calc(100dvh - var(--space-8));
  padding: var(--space-5);
  overflow-y: auto;
  border: 1px solid var(--border);
  border-right: 0;
  border-radius: var(--radius-card) 0 0 var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-raised);
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.drawer-head h2 {
  font-size: var(--text-title);
}

.drawer-head h2 span {
  color: var(--accent);
}

.drawer-head p,
.muted {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.close {
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-title);
  cursor: pointer;
}

.close:hover {
  background: var(--surface);
  color: var(--text);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.quick-actions button {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
}

.quick-actions button:hover {
  color: var(--text);
}

.composer,
.suggestion {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.composer textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  line-height: 1.5;
  resize: vertical;
}

.composer textarea:focus {
  border-color: var(--accent);
}

.error {
  margin-top: var(--space-3);
  color: var(--danger);
  font-size: var(--text-caption);
}

.suggestion {
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.suggestion > p {
  font-size: var(--text-caption);
  line-height: 1.6;
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

.assistant-drawer-enter-active,
.assistant-drawer-leave-active {
  transition:
    transform var(--motion-base) var(--ease),
    opacity var(--motion-fast) var(--ease);
}

.assistant-drawer-enter-from,
.assistant-drawer-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 600px) {
  .drawer {
    width: 100vw;
    max-height: 100dvh;
    padding-bottom: max(var(--space-5), env(safe-area-inset-bottom));
    border: 0;
    border-radius: 0;
  }
}
</style>

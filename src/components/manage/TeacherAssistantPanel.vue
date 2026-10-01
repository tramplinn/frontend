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
import { changesFor as diffChangesFor, type PatchField, patchFor } from '@/lib/teacherAssistantDiff'
import { useI18n } from '@/i18n'

const { t } = useI18n()

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
    ? [
        t('assistant.prompts.clearer'),
        t('assistant.prompts.fixErrors'),
        t('assistant.prompts.addExamples'),
      ]
    : [
        t('assistant.prompts.formatStatement'),
        t('assistant.prompts.checkAmbiguity'),
        t('assistant.prompts.addConstraints'),
      ],
)

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

function changesFor(turn: AssistantTurn) {
  return diffChangesFor(props.document, turn.suggestion)
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

function applyOneFor(turn: AssistantTurn, field: PatchField): void {
  emit('apply', patchFor(turn.suggestion, [field]))
  discardFor(turn, field)
}

function discardFor(turn: AssistantTurn, field: PatchField): void {
  turn.suggestion = { ...turn.suggestion, [field]: null }
}

function applyAllFor(turn: AssistantTurn): void {
  const fields = changesFor(turn).map((change) => change.field)
  emit('apply', patchFor(turn.suggestion, fields))
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
      :aria-label="t('assistant.open')"
      :title="t('assistant.name')"
      @click="openPanel"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z" fill="currentColor" />
      </svg>
    </button>

    <Transition name="assistant-drawer">
      <section v-if="open" class="chat" :aria-label="t('assistant.panel')">
        <header class="head">
          <div class="bar">
            <span class="title">{{ t('assistant.title') }}</span>
            <span class="hint">{{ t('assistant.hint') }}</span>
          </div>
          <button
            type="button"
            class="control close"
            :aria-label="t('manage.close')"
            @click="closePanel"
          >
            ×
          </button>
        </header>

        <div :ref="setLog" class="log">
          <template v-for="(turn, index) in turns" :key="index">
            <div v-if="turn.role === 'user'" class="turn turn--user">{{ turn.content }}</div>

            <div v-else class="turn turn--assistant">
              <p class="explanation">{{ turn.suggestion.explanation }}</p>
              <p v-if="changesFor(turn).length === 0" class="muted">
                {{ t('assistant.noChanges') }}
              </p>
              <article v-for="change in changesFor(turn)" :key="change.field" class="change">
                <header class="change-head">
                  <strong>{{ change.label }}</strong>
                  <span class="change-actions">
                    <button type="button" class="reject" @click="discardFor(turn, change.field)">
                      {{ t('assistant.reject') }}
                    </button>
                    <button type="button" class="accept" @click="applyOneFor(turn, change.field)">
                      {{ t('assistant.accept') }}
                    </button>
                  </span>
                </header>
                <div
                  class="diff"
                  role="region"
                  :aria-label="t('assistant.changesOf', { field: change.label })"
                >
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
                {{ t('assistant.applyAll') }}
              </AppButton>
            </div>
          </template>

          <p v-if="pending" class="waiting">{{ t('manage.thinking') }}</p>
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
              :placeholder="t('assistant.placeholder')"
              :aria-label="t('assistant.what')"
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
              {{ t('manage.send') }}
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

@media (max-width: 620px) {
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

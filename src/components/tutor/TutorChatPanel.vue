<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import { useFloatingPanel } from '@/composables/useFloatingPanel'
import { type AskTutor, useTutorChat } from '@/features/tutor/composables/useTutorChat'
import { useAuthStore } from '@/stores/auth'
import { useTutorStore } from '@/stores/tutor'

type Kind = 'lesson' | 'problem'

const COPY: Record<
  Kind,
  { tabLabel: string; panelLabel: string; hint: string; blank: string; placeholder: string }
> = {
  lesson: {
    tabLabel: 'Спросить по уроку',
    panelLabel: 'Ассистент урока',
    hint: 'про термин или непонятное место',
    blank:
      'Спросите про термин из урока или попросите объяснить кусок кода. Ассистент видит текст этого урока.',
    placeholder: 'вопрос по уроку',
  },
  problem: {
    tabLabel: 'Спросить по задаче',
    panelLabel: 'Ассистент задачи',
    hint: 'подскажет подход, но не решение целиком',
    blank:
      'Спросите про подход к задаче или разбор ошибки в коде. Готовое решение ассистент не даёт — только подсказки.',
    placeholder: 'вопрос по задаче',
  },
}

const props = defineProps<{ kind: Kind; contentId: string; ask: AskTutor }>()

const copy = computed(() => COPY[props.kind])

const auth = useAuthStore()
const tutor = useTutorStore()

const { isOpen: expanded, open: openPanel, close: closePanel } = useFloatingPanel('tutor')
const {
  answers,
  canSend,
  draft,
  error,
  loadRenderer,
  setLog,
  send,
  stop,
  streamed,
  streamedHtml,
  streaming,
  turns,
} = useTutorChat(() => props.contentId, props.ask)

function show(): void {
  openPanel()
  loadRenderer()
}

// Панель — singleton (useFloatingPanel хранит active на модуле), поэтому при
// повторном монтировании она может открыться сразу, минуя show().
if (expanded.value) loadRenderer()
</script>

<template>
  <div class="tutor-widget">
    <button
      v-if="!expanded"
      type="button"
      class="tutor-tab"
      :aria-label="copy.tabLabel"
      :title="copy.tabLabel"
      @click="show"
    >
      <span aria-hidden="true">✦</span>
    </button>

    <Transition name="tutor-drawer">
      <section v-if="expanded" class="chat" :aria-label="copy.panelLabel">
        <header class="head">
          <div class="bar">
            <span aria-hidden="true">✦</span>
            <span class="title">спросить</span>
            <span class="hint">{{ copy.hint }}</span>
          </div>

          <button
            v-if="turns.length > 0 && !streaming"
            type="button"
            class="control"
            @click="tutor.clear(props.contentId)"
          >
            очистить
          </button>

          <button type="button" class="control close" aria-label="Закрыть" @click="closePanel">
            ×
          </button>
        </header>

        <div :ref="setLog" class="log">
          <p v-if="turns.length === 0 && !streaming" class="blank">
            {{ copy.blank }}
            <template v-if="!auth.isAuthenticated">
              Без входа доступно несколько вопросов.
            </template>
          </p>

          <template v-for="(turn, index) in turns" :key="index">
            <div v-if="turn.role === 'user'" class="turn turn--user">{{ turn.content }}</div>
            <!-- Ответ модели — markdown, отрендеренный с html=false: сырой html из него
                 экранирован, поэтому v-html здесь безопасен. -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else-if="answers[index]" class="answer prose" v-html="answers[index]" />
            <div v-else class="turn">{{ turn.content }}</div>
          </template>

          <template v-if="streamed">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="streamedHtml" class="answer prose" v-html="streamedHtml" />
            <div v-else class="turn">{{ streamed }}</div>
          </template>
          <p v-else-if="streaming" class="waiting">думает…</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </div>

        <form class="composer" @submit.prevent="send">
          <textarea
            v-model="draft"
            class="input"
            rows="2"
            :placeholder="copy.placeholder"
            aria-label="Вопрос ассистенту"
            @keydown.enter.exact.prevent="send"
          ></textarea>
          <AppButton v-if="streaming" size="sm" variant="quiet" @click="stop">
            остановить
          </AppButton>
          <AppButton v-else type="submit" size="sm" variant="primary" :disabled="!canSend">
            спросить
          </AppButton>
        </form>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.tutor-widget {
  position: fixed;
  z-index: 50;
  top: 50%;
  right: 0;
}

.tutor-tab {
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
  font-size: var(--text-title);
  cursor: pointer;
  transform: translateY(-50%);
  transition: width var(--motion-fast) var(--ease);
}

.tutor-tab:hover {
  width: 34px;
  background: var(--accent-hover);
}

.bar > span:first-child {
  color: var(--accent);
}

.chat {
  position: fixed;
  top: 50%;
  right: 0;
  display: flex;
  flex-direction: column;
  width: min(420px, 100vw);
  height: calc(100dvh - var(--space-6));
  min-height: 0;
  container-type: inline-size;
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
  gap: var(--space-2);
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
}

.bar {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.title {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
}

.hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.control {
  flex-shrink: 0;
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.control:hover {
  background: var(--surface);
  color: var(--text);
}

.close {
  padding: 0;
  font-size: var(--text-title);
}

.log {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1 1 auto;
  min-height: var(--space-12);
  padding: var(--space-3) var(--space-4);
  overflow-y: auto;
  /* Иначе докрутка переписки до конца утаскивает за собой страницу под панелью. */
  overscroll-behavior: contain;
}

.blank {
  color: var(--text-muted);
  font-size: var(--text-caption);
  line-height: 1.5;
}

.turn {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: var(--text-caption);
  line-height: 1.6;
}

.answer {
  overflow-wrap: anywhere;
  font-size: var(--text-caption);
  line-height: 1.6;
}

/* Разметка приходит из v-html и атрибута scoped не получает. */
.answer :deep(> * + *) {
  margin-top: var(--space-3);
}

.answer :deep(pre) {
  overflow-x: auto;
}

.turn--user {
  align-self: flex-end;
  max-width: 85%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

.waiting,
.error {
  font-size: var(--text-caption);
}

.waiting {
  color: var(--text-muted);
}

.error {
  color: var(--danger);
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  flex: 0 0 auto;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
}

.input {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-input);
  line-height: 1.5;
  resize: none;
}

.input:focus {
  border-color: var(--accent);
}

.tutor-drawer-enter-active,
.tutor-drawer-leave-active {
  transition:
    transform var(--motion-base) var(--ease),
    opacity var(--motion-fast) var(--ease);
}

.tutor-drawer-enter-from,
.tutor-drawer-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(100%);
}

@media (max-width: 620px) {
  .chat {
    inset: 0;
    width: 100vw;
    height: 100dvh;
    border: none;
    border-radius: 0;
    transform: none;
  }

  .tutor-drawer-enter-from,
  .tutor-drawer-leave-to {
    transform: translateX(100%);
  }

  .chat .head {
    padding-top: max(var(--space-2), env(safe-area-inset-top));
  }

  .chat .composer {
    padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
  }
}

@container (max-width: 560px) {
  .hint {
    display: none;
  }
}
</style>

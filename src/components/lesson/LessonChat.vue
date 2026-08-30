<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { askTutor } from '@/api/tutor'
import type { TutorTurn } from '@/api/tutor'
import AppButton from '@/components/ui/AppButton.vue'
import { errorText } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'
import { useTutorStore } from '@/stores/tutor'

const props = defineProps<{ lessonId: string }>()

const STORAGE_KEY = 'tramplin:tutor-panel'

const auth = useAuthStore()
const tutor = useTutorStore()

const expanded = ref(readExpanded())
const draft = ref('')
const streamed = ref('')
const streaming = ref(false)
const error = ref<string | null>(null)
const log = ref<HTMLElement | null>(null)

let controller: AbortController | null = null

const turns = computed(() => tutor.turns(props.lessonId))
const canSend = computed(() => draft.value.trim().length > 0 && !streaming.value)

function readExpanded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'expanded'
  } catch {
    return false
  }
}

function toggle(): void {
  expanded.value = !expanded.value
  try {
    localStorage.setItem(STORAGE_KEY, expanded.value ? 'expanded' : 'collapsed')
  } catch {
    // Состояние просто не переживёт перезагрузку.
  }
}

function scrollToEnd(): void {
  void nextTick(() => {
    const element = log.value
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  })
}

function stop(): void {
  controller?.abort()
  controller = null
}

async function send(): Promise<void> {
  const question = draft.value.trim()
  if (!question || streaming.value) {
    return
  }
  const history: TutorTurn[] = [...turns.value, { role: 'user', content: question }]
  draft.value = ''
  error.value = null
  streamed.value = ''
  streaming.value = true
  tutor.setTurns(props.lessonId, history)
  scrollToEnd()

  controller = new AbortController()
  try {
    for await (const event of askTutor(props.lessonId, history, controller.signal)) {
      if ('delta' in event) {
        streamed.value += event.delta
        scrollToEnd()
      } else if ('error' in event) {
        error.value = event.error
      }
    }
  } catch (cause) {
    // Обрыв по кнопке «остановить» или уходу со страницы — не ошибка.
    if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
      error.value = errorText(cause)
    }
  } finally {
    // Успевшее прийти сохраняем в любом случае, даже при обрыве.
    if (streamed.value) {
      tutor.setTurns(props.lessonId, [...history, { role: 'assistant', content: streamed.value }])
    }
    streamed.value = ''
    streaming.value = false
    controller = null
    scrollToEnd()
  }
}

watch(
  () => props.lessonId,
  () => {
    stop()
    streamed.value = ''
    streaming.value = false
    error.value = null
    draft.value = ''
  },
)

onBeforeUnmount(stop)
</script>

<template>
  <section class="chat" :class="{ 'chat--collapsed': !expanded }" aria-label="Ассистент урока">
    <header class="head">
      <button type="button" class="bar" :aria-expanded="expanded" @click="toggle">
        <span class="chevron" aria-hidden="true"></span>
        <span class="title">спросить</span>
        <span v-if="expanded" class="hint">про термин или непонятное место</span>
      </button>

      <button
        v-if="expanded && turns.length > 0 && !streaming"
        type="button"
        class="control"
        @click="tutor.clear(props.lessonId)"
      >
        очистить
      </button>
    </header>

    <template v-if="expanded">
      <div ref="log" class="log">
        <p v-if="turns.length === 0 && !streaming" class="blank">
          Спросите про термин из урока или попросите объяснить кусок кода. Ассистент видит текст
          этого урока.
          <template v-if="!auth.isAuthenticated"> Без входа доступно несколько вопросов. </template>
        </p>

        <div v-for="(turn, index) in turns" :key="index" class="turn" :class="`turn--${turn.role}`">
          {{ turn.content }}
        </div>

        <div v-if="streamed" class="turn turn--assistant">{{ streamed }}</div>
        <p v-else-if="streaming" class="waiting">думает…</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>

      <form class="composer" @submit.prevent="send">
        <textarea
          v-model="draft"
          class="input"
          rows="2"
          placeholder="вопрос по уроку"
          aria-label="Вопрос ассистенту"
          @keydown.enter.exact.prevent="send"
        ></textarea>
        <AppButton v-if="streaming" size="sm" variant="quiet" @click="stop">остановить</AppButton>
        <AppButton v-else type="submit" size="sm" variant="primary" :disabled="!canSend">
          спросить
        </AppButton>
      </form>
    </template>
  </section>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  flex: var(--panel-grow, 1) 1 0;
  height: var(--panel-height, auto);
  min-height: 0;
  container-type: inline-size;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.chat--collapsed {
  flex: 0 0 auto;
  height: auto;
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-3);
}

.bar {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--motion-fast) var(--ease);
}

.bar:hover {
  background: var(--surface);
}

.chevron::before {
  content: '+';
  color: var(--text-muted);
}

.bar[aria-expanded='true'] .chevron::before {
  content: '−';
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

.log {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1 1 auto;
  min-height: var(--space-12);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
  overflow-y: auto;
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
  font-size: var(--text-caption);
  line-height: 1.5;
  resize: none;
}

.input:focus {
  border-color: var(--accent);
}

@container (max-width: 560px) {
  .hint {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import { useTutorChat } from '@/features/tutor/composables/useTutorChat'
import { useAuthStore } from '@/stores/auth'
import { useTutorStore } from '@/stores/tutor'

const props = defineProps<{ lessonId: string }>()

const STORAGE_KEY = 'tramplin:tutor-panel'

const auth = useAuthStore()
const tutor = useTutorStore()

const expanded = ref(readExpanded())
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
} = useTutorChat(() => props.lessonId)

onMounted(() => {
  if (expanded.value) {
    loadRenderer()
  }
})

function readExpanded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'expanded'
  } catch {
    return false
  }
}

function toggle(): void {
  expanded.value = !expanded.value
  if (expanded.value) {
    loadRenderer()
  }
  try {
    localStorage.setItem(STORAGE_KEY, expanded.value ? 'expanded' : 'collapsed')
  } catch {
    // Состояние просто не переживёт перезагрузку.
  }
}
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
      <div :ref="setLog" class="log">
        <p v-if="turns.length === 0 && !streaming" class="blank">
          Спросите про термин из урока или попросите объяснить кусок кода. Ассистент видит текст
          этого урока.
          <template v-if="!auth.isAuthenticated"> Без входа доступно несколько вопросов. </template>
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
  /* Своя высота, чтобы на узком экране чат не делил её поровну с картой модуля. */
  height: var(--chat-height, var(--panel-height, auto));
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
  /* Иначе докрутка переписки до конца утаскивает за собой страницу урока. */
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

@container (max-width: 560px) {
  .hint {
    display: none;
  }
}
</style>

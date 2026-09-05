<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'

import { uploadAsset } from '@/api/assets'
import { submitFeedback } from '@/api/feedback'
import { assetMimeSchema, type Asset } from '@/api/schemas/assets'
import FeedbackIcon from '@/components/layout/FeedbackIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useFloatingPanel } from '@/composables/useFloatingPanel'
import { errorText } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'

const MAX_ATTACHMENTS = 5
const MAX_MESSAGE = 4000
const ACCEPTED = assetMimeSchema.options.join(',')

const auth = useAuthStore()
const route = useRoute()
const { isOpen: open, open: openPanel, close: closePanel } = useFloatingPanel('feedback')
const message = ref('')
const attachments = ref<Asset[]>([])
const uploading = ref(false)
const submitting = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)
const textarea = ref<HTMLTextAreaElement | null>(null)

function show(): void {
  openPanel()
  sent.value = false
  error.value = null
  void nextTick(() => textarea.value?.focus())
}

function close(): void {
  if (!uploading.value && !submitting.value) {
    closePanel()
  }
}

async function attachFiles(files: File[]): Promise<void> {
  if (files.length === 0) return
  if (files.length > MAX_ATTACHMENTS - attachments.value.length) {
    error.value = `Можно прикрепить не больше ${String(MAX_ATTACHMENTS)} файлов`
    return
  }

  uploading.value = true
  error.value = null
  try {
    for (const file of files) {
      const mime = assetMimeSchema.safeParse(file.type)
      if (!mime.success) {
        throw new Error(`${file.name}: можно загрузить изображение или PDF`)
      }
      attachments.value.push(await uploadAsset(file, mime.data))
    }
  } catch (cause) {
    error.value =
      cause instanceof Error && cause.message.includes(':') ? cause.message : errorText(cause)
  } finally {
    uploading.value = false
  }
}

async function pickFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  await attachFiles(files)
}

async function pasteFiles(event: ClipboardEvent): Promise<void> {
  const clipboard = event.clipboardData
  if (!clipboard || uploading.value) return
  const directFiles = [...clipboard.files].filter((file) => file.type.startsWith('image/'))
  const files =
    directFiles.length > 0
      ? directFiles
      : [...clipboard.items]
          .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
  if (files.length === 0) return
  event.preventDefault()
  await attachFiles(files)
}

function detach(assetId: string): void {
  attachments.value = attachments.value.filter((asset) => asset.id !== assetId)
}

async function submit(): Promise<void> {
  const text = message.value.trim()
  if (!text || uploading.value) return

  submitting.value = true
  error.value = null
  try {
    await submitFeedback({
      message: text,
      pagePath: route.fullPath,
      attachmentIds: attachments.value.map((asset) => asset.id),
    })
    message.value = ''
    attachments.value = []
    sent.value = true
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="auth.isAuthenticated" class="feedback-widget">
    <button
      v-if="!open"
      type="button"
      class="trigger"
      aria-label="Обратная связь"
      title="Обратная связь"
      @click="show"
    >
      <FeedbackIcon />
    </button>

    <Transition name="feedback-panel">
      <aside v-if="open" class="panel" aria-label="Обратная связь">
        <header class="panel-header">
          <div>
            <h2>обратная связь</h2>
            <p>Идея, ошибка или вопрос — всё сюда.</p>
          </div>
          <button
            type="button"
            class="close"
            :disabled="uploading || submitting"
            aria-label="Закрыть"
            @click="close"
          >
            ×
          </button>
        </header>

        <div v-if="sent" class="success" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Спасибо!</strong>
            <p>Сообщение отправлено.</p>
          </div>
          <AppButton size="sm" variant="quiet" @click="close">закрыть</AppButton>
        </div>

        <form v-else class="form" @submit.prevent="submit">
          <label class="field">
            <span class="label">что случилось?</span>
            <textarea
              ref="textarea"
              v-model="message"
              class="message"
              rows="5"
              :maxlength="MAX_MESSAGE"
              placeholder="Опишите коротко — страницу мы приложим сами"
              @paste="pasteFiles"
            ></textarea>
          </label>

          <ul v-if="attachments.length" class="attachments">
            <li v-for="asset in attachments" :key="asset.id">
              <span :title="asset.filename">{{ asset.filename }}</span>
              <button
                type="button"
                :aria-label="`Убрать ${asset.filename}`"
                :disabled="uploading"
                @click="detach(asset.id)"
              >
                ×
              </button>
            </li>
          </ul>

          <div class="footer">
            <label
              class="attach"
              :class="{ disabled: uploading || attachments.length >= MAX_ATTACHMENTS }"
            >
              {{ uploading ? 'загружаю…' : 'прикрепить файл' }}
              <input
                class="visually-hidden"
                type="file"
                multiple
                :accept="ACCEPTED"
                :disabled="uploading || attachments.length >= MAX_ATTACHMENTS"
                @change="pickFiles"
              />
            </label>
            <AppButton
              type="submit"
              size="sm"
              variant="primary"
              :disabled="message.trim().length === 0 || uploading"
              :loading="submitting"
            >
              отправить
            </AppButton>
          </div>

          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </form>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
.trigger {
  position: fixed;
  z-index: 40;
  right: 0;
  bottom: calc(var(--ctl-sm) + var(--space-3));
  display: grid;
  place-items: center;
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  border: 1px solid var(--border);
  border-right: 0;
  border-radius: var(--radius-ctl) 0 0 var(--radius-ctl);
  background: var(--card);
  box-shadow: var(--shadow-raised);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    width var(--motion-fast) var(--ease),
    background var(--motion-fast) var(--ease);
}

.trigger:hover {
  width: calc(var(--ctl-sm) + var(--space-1));
  background: var(--surface);
}

.panel {
  position: fixed;
  z-index: 40;
  right: 0;
  bottom: calc(var(--ctl-sm) + var(--space-3));
  width: min(380px, calc(100vw - var(--space-8)));
  max-height: calc(100dvh - var(--space-8));
  padding: var(--space-4);
  overflow-y: auto;
  border: 1px solid var(--border);
  border-right: 0;
  border-radius: var(--radius-card) 0 0 var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-raised);
}

.feedback-panel-enter-active,
.feedback-panel-leave-active {
  transition:
    transform var(--motion-base) var(--ease),
    opacity var(--motion-fast) var(--ease);
}

.feedback-panel-enter-from,
.feedback-panel-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.panel-header h2 {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
}

.panel-header p,
.success p {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.close,
.attachments button {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.close {
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  border-radius: var(--radius-pill);
  font-size: var(--text-title);
}

.close:hover,
.attachments button:hover {
  background: var(--surface);
  color: var(--text);
}

.form {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.field {
  display: grid;
  gap: var(--space-2);
}

.label {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.message {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  line-height: 1.5;
  resize: vertical;
}

.message:focus {
  border-color: var(--accent);
}

.attachments {
  display: grid;
  gap: var(--space-1);
  list-style: none;
}

.attachments li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding-left: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: var(--text-caption);
}

.attachments span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachments button {
  width: var(--ctl-sm);
  height: var(--ctl-sm);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.attach {
  color: var(--accent);
  font-size: var(--text-caption);
  cursor: pointer;
}

.attach.disabled {
  color: var(--text-muted);
  cursor: default;
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.success {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--success-soft);
}

.success > span {
  display: grid;
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--success);
  color: var(--on-success);
}

@media (max-width: 520px) {
  .panel {
    width: 100vw;
    max-height: 100dvh;
    padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
    border: 0;
    border-radius: 0;
  }
}
</style>

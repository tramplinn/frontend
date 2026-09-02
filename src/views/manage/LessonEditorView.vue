<script setup lang="ts">
import LessonBody from '@/components/lesson/LessonBody.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useLessonEditor } from '@/features/lesson-editor/composables/useLessonEditor'
import { errorText } from '@/lib/errors'
import { withCount } from '@/lib/plural'

const props = defineProps<{ lesson: string }>()

const {
  uploadingAsset,
  dragging,
  assetError,
  onPaste,
  onDrop,
  onDragOver,
  onDragLeave,
  bodyMd,
  cards,
  dirty,
  error,
  html,
  loaded,
  pending,
  previewError,
  save,
  saveError,
  savedAt,
  saving,
  setSource,
  title,
} = useLessonEditor(() => props.lesson)
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <section v-if="loaded" class="editor">
      <header class="head">
        <input v-model="title" class="title-input" aria-label="Название урока" />
        <div class="head-side">
          <StatusChip :status="loaded.status" />
          <span v-if="dirty" class="dirty">есть несохранённые правки</span>
          <span v-else-if="savedAt" class="saved">
            сохранено в {{ savedAt.toLocaleTimeString('ru-RU', { timeStyle: 'short' }) }}
          </span>
        </div>
      </header>

      <div class="panes">
        <div class="pane">
          <div class="pane-head">
            <h2 class="pane-title">markdown</h2>
            <span v-if="cards.length > 0" class="pane-meta">
              {{ withCount(cards.length, 'карточка', 'карточки', 'карточек') }}
            </span>
          </div>
          <textarea
            :ref="setSource"
            v-model="bodyMd"
            class="source"
            :class="{ 'source--drop': dragging }"
            spellcheck="false"
            aria-label="Исходник урока"
            @paste="onPaste"
            @drop="onDrop"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
          ></textarea>
          <p class="hint">
            {{
              uploadingAsset
                ? 'загружаю файл…'
                : 'картинку можно вставить из буфера или перетащить в поле'
            }}
          </p>
          <p v-if="assetError" class="preview-error">{{ assetError }}</p>
          <p v-if="previewError" class="preview-error">{{ previewError }}</p>
        </div>

        <div class="pane">
          <div class="pane-head">
            <h2 class="pane-title">предпросмотр</h2>
          </div>
          <div class="preview">
            <LessonBody :html="html" />
          </div>
        </div>
      </div>

      <p v-if="saveError" class="save-error" role="alert">{{ errorText(saveError) }}</p>

      <footer class="actions">
        <AppButton variant="secondary" :loading="saving" @click="save()">сохранить</AppButton>
        <AppButton
          v-if="loaded.status === 'draft'"
          variant="primary"
          :loading="saving"
          @click="save('published')"
        >
          опубликовать
        </AppButton>
        <AppButton v-else variant="quiet" :loading="saving" @click="save('draft')">
          снять с публикации
        </AppButton>
        <RouterLink :to="{ name: 'manage-content' }" class="back">← к списку</RouterLink>
      </footer>
    </section>
  </LoadState>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.title-input {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.title-input:hover {
  border-color: var(--border);
}

.title-input:focus {
  border-color: var(--accent);
  outline: none;
  background: var(--card);
}

.head-side {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.dirty,
.saved {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.dirty {
  color: var(--warning);
}

.panes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.pane-title {
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}

.pane-meta {
  margin-left: auto;
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.source {
  min-height: 60vh;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  line-height: 1.7;
  resize: vertical;
}

.source:focus {
  outline: none;
  border-color: var(--accent);
}

.source--drop {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.hint {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.preview {
  min-height: 60vh;
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  overflow-x: auto;
}

.preview-error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-caption);
}

.save-error {
  margin-top: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.back {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.back:hover {
  color: var(--text);
}

@media (max-width: 1000px) {
  .panes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

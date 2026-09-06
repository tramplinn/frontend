<script setup lang="ts">
import MarkdownEditor from '@/components/manage/MarkdownEditor.vue'
import TeacherAssistantPanel from '@/components/manage/TeacherAssistantPanel.vue'
import type { TeacherAssistantPatch } from '@/api/schemas/teacherAssistant'
import AppButton from '@/components/ui/AppButton.vue'
import BackLink from '@/components/ui/BackLink.vue'
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

function applyAssistantPatch(patch: TeacherAssistantPatch): void {
  if (patch.title !== null) title.value = patch.title
  if (patch.bodyMd !== null) bodyMd.value = patch.bodyMd
}
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
          <BackLink :to="{ name: 'manage-content' }">к списку</BackLink>
        </div>
      </header>

      <MarkdownEditor
        v-model="bodyMd"
        :html="html"
        source-label="Исходник урока"
        :dragging="dragging"
        :uploading="uploadingAsset"
        :asset-error="assetError"
        :preview-error="previewError"
        @source="setSource"
        @paste="onPaste"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <template #source-meta>
          <span v-if="cards.length > 0" class="pane-meta">
            {{ withCount(cards.length, 'карточка', 'карточки', 'карточек') }}
          </span>
        </template>
      </MarkdownEditor>

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
      </footer>

      <TeacherAssistantPanel
        surface="lesson"
        :document="{ title, bodyMd }"
        @apply="applyAssistantPatch"
      />
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

.pane-meta {
  font-size: var(--text-caption);
  color: var(--text-muted);
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
</style>

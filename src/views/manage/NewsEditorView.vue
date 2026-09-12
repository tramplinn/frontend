<script setup lang="ts">
import { ref } from 'vue'

import MarkdownEditor from '@/components/manage/MarkdownEditor.vue'
import NewsPhotoStrip from '@/components/manage/NewsPhotoStrip.vue'
import AppButton from '@/components/ui/AppButton.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useNewsEditor } from '@/features/news/composables/useNewsEditor'
import { errorText } from '@/lib/errors'

const props = defineProps<{ news: string }>()

const {
  actionError,
  attachPhotos,
  autosaving,
  bodyMd,
  busy,
  detachPhoto,
  error,
  html,
  load,
  loaded,
  movePhoto,
  pending,
  saveError,
  savedAt,
  saving,
  setStatus,
  summary,
  title,
} = useNewsEditor(() => props.news)

const fileInput = ref<HTMLInputElement | null>(null)

function pickPhotos(): void {
  fileInput.value?.click()
}

function onFiles(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files) attachPhotos([...input.files])
  input.value = ''
}
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <section v-if="loaded" class="editor">
      <header class="head">
        <input v-model="title" class="title-input" aria-label="Заголовок новости" />
        <div class="head-side">
          <StatusChip :status="loaded.status" />
          <span v-if="autosaving" class="dirty">сохраняю…</span>
          <span v-else-if="savedAt" class="saved">
            сохранено в {{ savedAt.toLocaleTimeString('ru-RU', { timeStyle: 'short' }) }}
          </span>
          <BackLink :to="{ name: 'manage-news' }">к списку</BackLink>
        </div>
      </header>

      <input
        v-model="summary"
        class="summary-input"
        placeholder="анонс"
        aria-label="Анонс новости"
      />

      <p v-if="actionError" class="save-error" role="alert">{{ actionError }}</p>

      <input
        ref="fileInput"
        type="file"
        class="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        @change="onFiles"
      />

      <div class="photos">
        <div class="photos-head">
          <span class="photos-title">фото</span>
          <AppButton size="sm" variant="quiet" :disabled="busy" @click="pickPhotos">
            + фото
          </AppButton>
        </div>
        <NewsPhotoStrip
          v-if="loaded.photos.length > 0"
          :photos="loaded.photos"
          :busy="busy"
          @move="movePhoto"
          @detach="detachPhoto"
        />
      </div>

      <MarkdownEditor v-model="bodyMd" :html="html" source-label="Исходник новости" />

      <p v-if="saveError" class="save-error" role="alert">{{ errorText(saveError) }}</p>

      <footer class="actions">
        <AppButton
          v-if="loaded.status === 'draft'"
          variant="primary"
          :loading="saving"
          @click="setStatus('published')"
        >
          опубликовать
        </AppButton>
        <AppButton v-else variant="quiet" :loading="saving" @click="setStatus('draft')">
          снять с публикации
        </AppButton>
      </footer>
    </section>
  </LoadState>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
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

.summary-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-6);
  border: 1px solid transparent;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-body);
}

.summary-input:hover {
  border-color: var(--border);
}

.summary-input:focus {
  border-color: var(--accent);
  outline: none;
  background: var(--card);
  color: var(--text);
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

.file {
  display: none;
}

.photos {
  margin-bottom: var(--space-6);
}

.photos-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.photos-title {
  color: var(--text-muted);
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
</style>

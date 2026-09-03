<script setup lang="ts">
import { ref } from 'vue'

import type { News } from '@/api/schemas/news'
import NewsEditor from '@/components/manage/NewsEditor.vue'
import NewsPhotoStrip from '@/components/manage/NewsPhotoStrip.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useNewsDesk } from '@/features/news/composables/useNewsDesk'
import { formatNewsDate } from '@/lib/newsDate'

const {
  items,
  pending,
  error,
  actionError,
  busy,
  editing,
  add,
  save,
  remove,
  togglePublished,
  toggleEditing,
  attachPhotos,
  detachPhoto,
  movePhoto,
} = useNewsDesk()

const uploadFor = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function pickPhotos(news: News): void {
  uploadFor.value = news.id
  fileInput.value?.click()
}

function onFiles(event: Event): void {
  const input = event.target as HTMLInputElement
  const news = items.value.find((item) => item.id === uploadFor.value)
  if (news && input.files) {
    attachPhotos(news, [...input.files])
  }
  input.value = ''
  uploadFor.value = null
}
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">новости</h1>
      <InlineCreate label="новость" placeholder="заголовок новости" :saving="busy" @create="add" />
    </header>

    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

    <input
      ref="fileInput"
      type="file"
      class="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      multiple
      @change="onFiles"
    />

    <LoadState :pending="pending" :error="error">
      <p v-if="items.length === 0" class="blank">Пока ни одной новости.</p>

      <ul v-else class="list">
        <li v-for="news in items" :key="news.id" class="row">
          <div class="line">
            <span class="title">{{ news.title }}</span>
            <StatusChip :status="news.status" />
            <span v-if="news.publishedAt" class="date">{{ formatNewsDate(news.publishedAt) }}</span>

            <div class="actions">
              <AppButton size="sm" variant="quiet" :disabled="busy" @click="toggleEditing(news.id)">
                {{ editing === news.id ? 'свернуть' : 'править' }}
              </AppButton>
              <AppButton size="sm" variant="quiet" :disabled="busy" @click="pickPhotos(news)">
                + фото
              </AppButton>
              <AppButton size="sm" variant="quiet" :disabled="busy" @click="togglePublished(news)">
                {{ news.status === 'published' ? 'в черновик' : 'опубликовать' }}
              </AppButton>
              <ConfirmButton :loading="busy" @confirm="remove(news.id)" />
            </div>
          </div>

          <NewsPhotoStrip
            v-if="news.photos.length > 0"
            :photos="news.photos"
            :busy="busy"
            @move="(index, delta) => movePhoto(news, index, delta)"
            @detach="(assetId) => detachPhoto(news, assetId)"
          />

          <NewsEditor
            v-if="editing === news.id"
            :news="news"
            :busy="busy"
            @save="(changes) => save(news.id, changes)"
            @cancel="editing = null"
          />
        </li>
      </ul>
    </LoadState>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-8);
}

.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.file {
  display: none;
}

.error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.blank {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
}

.row {
  padding: var(--space-4);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.line {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.title {
  font-weight: var(--weight-medium);
}

.date {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
}
</style>

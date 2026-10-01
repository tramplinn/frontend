<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { getNews } from '@/api/news'
import type { News } from '@/api/schemas/news'
import NewsPhotos from '@/components/news/NewsPhotos.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { renderMarkdown } from '@/lib/markdown'
import { formatNewsDate } from '@/lib/newsDate'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ slug: string }>()

const news = ref<News | null>(null)
const pending = ref(true)
const error = ref<unknown>(null)
let version = 0

const date = computed(() => (news.value ? formatNewsDate(news.value.publishedAt) : ''))
const body = computed(() => (news.value ? renderMarkdown(news.value.bodyMd) : ''))

async function load(): Promise<void> {
  const current = ++version
  pending.value = true
  error.value = null
  try {
    const loaded = await getNews(props.slug)
    if (current === version) news.value = loaded
  } catch (cause) {
    if (current === version) error.value = cause
  } finally {
    if (current === version) pending.value = false
  }
}

onMounted(() => void load())
watch(
  () => props.slug,
  () => void load(),
)
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <article v-if="news" class="post">
      <BackLink :to="{ name: 'home' }" class="back">{{ t('news.all') }}</BackLink>

      <h1 class="title">{{ news.title }}</h1>
      <p v-if="date" class="date">{{ date }}</p>

      <NewsPhotos v-if="news.photos.length > 0" class="photos" :photos="news.photos" />

      <p v-if="news.summary" class="summary">{{ news.summary }}</p>

      <!-- renderMarkdown работает с html: false, сырой html из текста экранирован. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="news.bodyMd" class="prose" v-html="body" />
    </article>
  </LoadState>
</template>

<style scoped>
.post {
  max-width: var(--learning-width);
}

.back {
  margin-bottom: var(--space-6);
}

.title {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.date {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.photos {
  margin-top: var(--space-6);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.summary {
  margin-top: var(--space-6);
  font-size: var(--text-title);
  line-height: 1.5;
}

.prose {
  margin-top: var(--space-6);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

import type { News } from '@/api/schemas/news'
import NewsPhotos from '@/components/news/NewsPhotos.vue'
import { formatNewsDate } from '@/lib/newsDate'

const props = defineProps<{ news: News }>()

const date = computed(() => formatNewsDate(props.news.publishedAt))
</script>

<template>
  <article class="card">
    <NewsPhotos v-if="props.news.photos.length > 0" :photos="props.news.photos" compact />

    <div class="body">
      <RouterLink :to="{ name: 'news-item', params: { slug: props.news.slug } }" class="title-link">
        <h2 class="title">{{ props.news.title }}</h2>
      </RouterLink>

      <p v-if="date" class="date">{{ date }}</p>
      <p v-if="props.news.summary" class="summary">{{ props.news.summary }}</p>
    </div>
  </article>
</template>

<style scoped>
.card {
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.body {
  padding: var(--space-6);
}

.title-link:hover .title {
  color: var(--accent);
}

.title {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  transition: color var(--motion-fast) var(--ease);
}

.date {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.summary {
  margin-top: var(--space-3);
  color: var(--text-muted);
  line-height: 1.6;
}
</style>

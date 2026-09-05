<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { listNews } from '@/api/news'
import type { News } from '@/api/schemas/news'
import NewsCard from '@/components/news/NewsCard.vue'
import RecommendationsAside from '@/components/recommendations/RecommendationsAside.vue'
import LoadState from '@/components/ui/LoadState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const PAGE = 10

const items = ref<News[]>([])
const total = ref(0)
const pending = ref(true)
const error = ref<unknown>(null)
const loadingMore = ref(false)

const hasMore = computed(() => items.value.length < total.value)

async function loadPage(): Promise<void> {
  const page = await listNews(PAGE, items.value.length)
  items.value = [...items.value, ...page.items]
  total.value = page.total
}

async function loadMore(): Promise<void> {
  loadingMore.value = true
  try {
    await loadPage()
  } catch (cause) {
    error.value = cause
  } finally {
    loadingMore.value = false
  }
}

onMounted(async () => {
  try {
    await loadPage()
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <div class="page">
    <section class="news-page">
      <h1 class="heading">новости</h1>

      <LoadState :pending="pending" :error="error">
        <p v-if="items.length === 0" class="blank">Новостей пока нет.</p>

        <template v-else>
          <div class="feed">
            <NewsCard v-for="item in items" :key="item.id" :news="item" />
          </div>

          <AppButton
            v-if="hasMore"
            class="more"
            size="sm"
            variant="quiet"
            :loading="loadingMore"
            @click="loadMore"
          >
            показать ещё
          </AppButton>
        </template>
      </LoadState>
    </section>

    <RecommendationsAside v-if="auth.isAuthenticated" class="rail" />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
  gap: var(--space-8);
}

.rail {
  position: sticky;
  top: var(--space-6);
}

.heading {
  margin-bottom: var(--space-8);
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.blank {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.feed {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--learning-width);
}

.more {
  margin-top: var(--space-6);
}

@media (max-width: 900px) {
  .page {
    grid-template-columns: 1fr;
  }

  .rail {
    position: static;
  }
}

@media (max-width: 600px) {
  .heading {
    margin-bottom: var(--space-5);
  }

  .feed {
    width: calc(100% + var(--space-3));
    max-width: none;
    padding-right: var(--space-3);
    overflow-x: auto;
    flex-direction: row;
    gap: var(--space-3);
    scroll-padding-inline: 0 var(--space-3);
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .feed::-webkit-scrollbar {
    display: none;
  }

  .feed > * {
    flex: 0 0 min(88%, 420px);
    scroll-snap-align: start;
  }
}
</style>

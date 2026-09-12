<script setup lang="ts">
import InlineCreate from '@/components/manage/InlineCreate.vue'
import LoadState from '@/components/ui/LoadState.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useNewsDesk } from '@/features/news/composables/useNewsDesk'
import { formatNewsDate } from '@/lib/newsDate'

const { items, pending, error, actionError, busy, load, add, remove, togglePublished } =
  useNewsDesk()
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">новости</h1>
      <InlineCreate label="новость" placeholder="заголовок новости" :saving="busy" @create="add" />
    </header>

    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

    <LoadState :pending="pending" :error="error" @retry="load">
      <p v-if="items.length === 0" class="blank">Пока ни одной новости.</p>

      <ul v-else class="list">
        <li v-for="news in items" :key="news.id" class="item">
          <RouterLink
            class="item-link"
            :to="{ name: 'manage-news-item', params: { news: news.id } }"
          >
            <span class="item-title">{{ news.title }}</span>
            <StatusChip :status="news.status" />
            <span v-if="news.publishedAt" class="item-meta">
              {{ formatNewsDate(news.publishedAt) }}
            </span>
          </RouterLink>

          <RowMenu :disabled="busy" :label="`Действия: ${news.title}`">
            <RowMenuItem @select="togglePublished(news)">
              {{ news.status === 'published' ? 'в черновик' : 'опубликовать' }}
            </RowMenuItem>
            <RowMenuItem danger @select="remove(news.id)">удалить новость</RowMenuItem>
          </RowMenu>
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
  gap: var(--space-1);
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  transition: background var(--motion-fast) var(--ease);
}

.item:hover {
  background: var(--surface-hover);
}

.item-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-caption);
}

.item-title {
  overflow: hidden;
  font-weight: var(--weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

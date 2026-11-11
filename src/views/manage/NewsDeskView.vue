<script setup lang="ts">
import ManageList from '@/components/manage/ManageList.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import LoadState from '@/components/ui/LoadState.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useNewsDesk } from '@/features/news/composables/useNewsDesk'
import { formatNewsDate } from '@/lib/newsDate'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const { items, pending, error, actionError, busy, load, add, remove, togglePublished } =
  useNewsDesk()
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">{{ t('newsEditor.heading') }}</h1>
      <InlineCreate
        :label="t('newsEditor.item')"
        :placeholder="t('newsEditor.titlePlaceholder')"
        :saving="busy"
        @create="add"
      />
    </header>

    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

    <LoadState :pending="pending" :error="error" @retry="load">
      <p v-if="items.length === 0" class="blank">{{ t('newsEditor.empty') }}</p>

      <ManageList
        v-else
        :items="items"
        :to="(news) => ({ name: 'manage-news-item', params: { news: news.id } })"
      >
        <template #badges="{ item }"><StatusChip :status="item.status" /></template>
        <template #meta="{ item }">
          <span v-if="item.publishedAt">{{ formatNewsDate(item.publishedAt) }}</span>
        </template>
        <template #actions="{ item }">
          <RowMenu :disabled="busy" :label="t('manage.actionsFor', { title: item.title })">
            <RowMenuItem @select="togglePublished(item)">
              {{ item.status === 'published' ? t('manage.toDraft') : t('manage.publish') }}
            </RowMenuItem>
            <RowMenuItem danger @select="remove(item.id)">{{ t('newsEditor.delete') }}</RowMenuItem>
          </RowMenu>
        </template>
      </ManageList>
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
</style>

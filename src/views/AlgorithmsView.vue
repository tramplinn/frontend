<script setup lang="ts">
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FilterChip from '@/components/ui/FilterChip.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useAlgorithmCatalog } from '@/features/algorithms/composables/useAlgorithmCatalog'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, languageLabel } from '@/lib/algorithms'

const {
  difficulty,
  error,
  hasMore,
  items,
  page,
  pending,
  search,
  solvedCount,
  tagId,
  tags,
  total,
} = useAlgorithmCatalog()

function toggleDifficulty(value: AlgorithmDifficulty): void {
  difficulty.value = difficulty.value === value ? null : value
}

function toggleTag(id: string): void {
  tagId.value = tagId.value === id ? null : id
}
</script>

<template>
  <section class="page">
    <header class="head">
      <div>
        <h1>алгосы</h1>
      </div>
      <p v-if="total > 0" class="counter">
        решено {{ solvedCount }} из {{ items.length }} на странице · всего {{ total }}
      </p>
    </header>

    <div class="filters">
      <label class="search">
        <span class="visually-hidden">Поиск по названию</span>
        <input v-model="search" type="search" class="text-field" placeholder="поиск по названию" />
      </label>

      <div class="chips" role="group" aria-label="Сложность">
        <FilterChip
          v-for="value in DIFFICULTY_ORDER"
          :key="value"
          :pressed="difficulty === value"
          @click="toggleDifficulty(value)"
        >
          {{ DIFFICULTY_LABELS[value] }}
        </FilterChip>
      </div>

      <div v-if="tags.length > 0" class="chips" role="group" aria-label="Темы">
        <FilterChip
          v-for="tag in tags"
          :key="tag.id"
          :pressed="tagId === tag.id"
          @click="toggleTag(tag.id)"
        >
          {{ tag.name }}
        </FilterChip>
      </div>
    </div>

    <LoadState :pending="pending" :error="error">
      <p v-if="items.length === 0" class="muted empty">
        Ничего не нашлось. Попробуй снять фильтры.
      </p>

      <ul v-else class="list">
        <li v-for="item in items" :key="item.id">
          <RouterLink
            :to="{ name: 'algorithm-solo', params: { problem: item.id } }"
            class="card"
            :class="{ 'card--solved': item.solved }"
          >
            <span class="body">
              <span class="title">{{ item.title }}</span>
              <span class="meta">
                <DifficultyChip :difficulty="item.difficulty" />
                <span v-for="tag in item.tags" :key="tag.id" class="topic">{{ tag.name }}</span>
                <span v-if="item.languages.length > 0" class="langs">
                  {{ item.languages.map(languageLabel).join(' · ') }}
                </span>
              </span>
            </span>

            <span class="attempts">
              {{ item.attempts > 0 ? `попыток: ${item.attempts}` : 'не начата' }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <div v-if="total > items.length || page > 0" class="pager">
        <AppButton size="sm" :disabled="page === 0" @click="page -= 1">назад</AppButton>
        <span class="muted">страница {{ page + 1 }}</span>
        <AppButton size="sm" :disabled="!hasMore" @click="page += 1">дальше</AppButton>
      </div>
    </LoadState>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.head h1 {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.muted,
.counter {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.muted {
  margin-top: var(--space-2);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.search input {
  width: 100%;
  max-width: 420px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.list {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}

.card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  color: inherit;
  text-decoration: none;
  transition: background var(--motion-fast) var(--ease);
}

.card:hover {
  background: var(--card-hover);
}

.card--solved {
  border-color: var(--success);
}

.body {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  flex: 1;
}

.title {
  font-weight: var(--weight-medium);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.langs,
.attempts {
  color: var(--text-muted);
  font-size: var(--text-micro);
}

.attempts {
  flex: none;
  text-align: right;
}

.empty {
  padding: var(--space-12) 0;
}

.pager {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

@media (max-width: 600px) {
  .card {
    align-items: flex-start;
  }

  .attempts {
    display: none;
  }
}
</style>

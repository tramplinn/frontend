<script setup lang="ts">
import type { AlgorithmDifficulty } from '@/api/schemas/algorithms'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import AppButton from '@/components/ui/AppButton.vue'
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
  topic,
  topics,
  total,
} = useAlgorithmCatalog()

function toggleDifficulty(value: AlgorithmDifficulty): void {
  difficulty.value = difficulty.value === value ? null : value
}

function toggleTopic(value: string): void {
  topic.value = topic.value === value ? null : value
}
</script>

<template>
  <section class="page">
    <header class="head">
      <div>
        <h1>алгосы</h1>
        <p class="muted">Тренажёр: задачи можно решать вне курса, прогресс сохраняется.</p>
      </div>
      <p v-if="total > 0" class="counter">
        решено {{ solvedCount }} из {{ items.length }} на странице · всего {{ total }}
      </p>
    </header>

    <div class="filters">
      <label class="search">
        <span class="sr-only">Поиск по названию</span>
        <input v-model="search" type="search" placeholder="поиск по названию" />
      </label>

      <div class="chips" role="group" aria-label="Сложность">
        <button
          v-for="value in DIFFICULTY_ORDER"
          :key="value"
          type="button"
          class="filter"
          :class="{ 'filter--on': difficulty === value }"
          :aria-pressed="difficulty === value"
          @click="toggleDifficulty(value)"
        >
          {{ DIFFICULTY_LABELS[value] }}
        </button>
      </div>

      <div v-if="topics.length > 0" class="chips" role="group" aria-label="Темы">
        <button
          v-for="value in topics"
          :key="value"
          type="button"
          class="filter"
          :class="{ 'filter--on': topic === value }"
          :aria-pressed="topic === value"
          @click="toggleTopic(value)"
        >
          {{ value }}
        </button>
      </div>
    </div>

    <LoadState :pending="pending" :error="error">
      <p v-if="items.length === 0" class="muted empty">
        Ничего не нашлось. Попробуй снять фильтры.
      </p>

      <ul v-else class="list">
        <li v-for="item in items" :key="item.id">
          <RouterLink :to="{ name: 'algorithm-solo', params: { problem: item.id } }" class="card">
            <span class="mark" :class="{ 'mark--solved': item.solved }" aria-hidden="true">
              {{ item.solved ? '✓' : '' }}
            </span>

            <span class="body">
              <span class="title">{{ item.title }}</span>
              <span class="meta">
                <DifficultyChip :difficulty="item.difficulty" />
                <span v-for="value in item.topics" :key="value" class="topic">{{ value }}</span>
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
  display: grid;
  gap: var(--space-3);
}

.search input {
  width: 100%;
  max-width: 420px;
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-input);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filter {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.filter:hover {
  background: var(--surface);
}

.filter--on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
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

.mark {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--space-6);
  height: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  color: var(--on-success);
  font-size: var(--text-caption);
}

.mark--solved {
  background: var(--success);
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

.topic {
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--text-micro);
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
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

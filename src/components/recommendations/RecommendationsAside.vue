<script setup lang="ts">
import LoadState from '@/components/ui/LoadState.vue'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import { useRecommendations } from '@/features/recommendations/composables/useRecommendations'
import { hours } from '@/lib/hours'
import RecommendationRow from './RecommendationRow.vue'

const { courses, algorithms, pending, error } = useRecommendations()
</script>

<template>
  <aside v-if="pending || error || algorithms.length > 0 || courses.length > 0" class="aside">
    <LoadState :pending="pending" :error="error">
      <div v-if="algorithms.length > 0" class="block">
        <h2 class="heading">рекомендуем алгосы</h2>
        <div class="list">
          <RecommendationRow
            v-for="item in algorithms"
            :key="item.id"
            :to="{ name: 'algorithm-solo', params: { problem: item.id } }"
            :title="item.title"
            :tags="item.tags"
          >
            <DifficultyChip :difficulty="item.difficulty" />
          </RecommendationRow>
        </div>
      </div>

      <div v-if="courses.length > 0" class="block">
        <h2 class="heading">рекомендуем курсы</h2>
        <div class="list">
          <RecommendationRow
            v-for="item in courses"
            :key="item.id"
            :to="{ name: 'course', params: { course: item.slug } }"
            :title="item.title"
            :tags="item.tags"
          >
            <span v-if="item.estHours !== null" class="hours">{{ hours(item.estHours) }}</span>
          </RecommendationRow>
        </div>
      </div>
    </LoadState>
  </aside>
</template>

<style scoped>
.aside {
  display: grid;
  gap: var(--space-6);
  align-content: start;
}

.block {
  display: grid;
  gap: var(--space-2);
}

.heading {
  padding: 0 var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.list {
  display: grid;
  gap: var(--space-1);
}

.hours {
  color: var(--text-muted);
  font-size: var(--text-micro);
}
</style>

<script setup lang="ts">
import LoadState from '@/components/ui/LoadState.vue'
import { useRecommendations } from '@/features/recommendations/composables/useRecommendations'
import RecommendedAlgorithmRow from './RecommendedAlgorithmRow.vue'
import RecommendedCourseRow from './RecommendedCourseRow.vue'

const { courses, algorithms, pending, error } = useRecommendations()
</script>

<template>
  <aside v-if="pending || error || algorithms.length > 0 || courses.length > 0" class="aside">
    <LoadState :pending="pending" :error="error">
      <div v-if="algorithms.length > 0" class="block">
        <h2 class="heading">рекомендуем алгосы</h2>
        <div class="list">
          <RecommendedAlgorithmRow v-for="item in algorithms" :key="item.id" :item="item" />
        </div>
      </div>

      <div v-if="courses.length > 0" class="block">
        <h2 class="heading">рекомендуем курсы</h2>
        <div class="list">
          <RecommendedCourseRow v-for="item in courses" :key="item.id" :item="item" />
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
</style>

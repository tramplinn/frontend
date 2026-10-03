<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import SignInGate from '@/components/layout/SignInGate.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useStartedCoursesQuery } from '@/features/learning/queries'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'

const { t, tc } = useI18n()
const auth = useAuthStore()
const { started, inProgress, finished, completedCount, isLoading, error, refetch } =
  useStartedCoursesQuery()
</script>

<template>
  <section>
    <h1 class="heading">{{ t('home.heading') }}</h1>

    <SignInGate
      v-if="!auth.isAuthenticated"
      class="gate-offset"
      :title="t('home.gateTitle')"
      :text="t('home.gateText')"
    />

    <LoadState v-else :pending="isLoading" :error="error" @retry="refetch()">
      <div v-if="started.length === 0" class="blank">
        <p class="blank-text">{{ t('home.empty') }}</p>
        <RouterLink :to="{ name: 'catalog' }" class="blank-link"
          >{{ t('home.openCatalog') }}<ArrowRight :size="14" aria-hidden="true"
        /></RouterLink>
      </div>

      <template v-else>
        <p class="total">
          {{ t('home.completedLessons', { lessons: tc('units.lessons', completedCount) }) }}
        </p>

        <div v-if="inProgress.length > 0" class="block">
          <h2 class="block-title">{{ t('home.continue') }}</h2>
          <div class="grid">
            <RouterLink
              v-for="course in inProgress"
              :key="course.slug"
              :to="{ name: 'course', params: { course: course.slug } }"
              class="card"
            >
              <span class="card-title">{{ course.title }}</span>
              <span v-if="course.summary" class="card-summary">{{ course.summary }}</span>
              <span class="card-progress">
                <ProgressBar
                  :value="course.completed"
                  :max="course.total"
                  :label="t('home.courseProgress', { title: course.title })"
                />
                <span class="card-count">{{ course.completed }}/{{ course.total }}</span>
              </span>
            </RouterLink>
          </div>
        </div>

        <div v-if="finished.length > 0" class="block">
          <h2 class="block-title">{{ t('home.finished') }}</h2>
          <div class="grid">
            <RouterLink
              v-for="course in finished"
              :key="course.slug"
              :to="{ name: 'course', params: { course: course.slug } }"
              class="card card--done"
            >
              <span class="card-title">{{ course.title }}</span>
              <span class="card-count card-count--done">
                {{ tc('units.lessons', course.total) }}
              </span>
            </RouterLink>
          </div>
        </div>
      </template>
    </LoadState>
  </section>
</template>

<style scoped>
.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-2);
}

.gate-offset {
  /* Вместе с отступом заголовка — те же 24px, что под шапкой «людей». */
  margin-top: var(--space-4);
}

.total {
  margin-bottom: var(--space-8);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.block + .block {
  margin-top: var(--space-8);
}

.block-title {
  margin-bottom: var(--space-4);
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.card:hover {
  background: var(--card-hover);
  border-color: var(--text-muted);
}

.card-title {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  letter-spacing: -0.01em;
}

.card-summary {
  color: var(--text-muted);
  font-size: var(--text-caption);
  line-height: 1.5;
}

.card-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.card-count {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-variant-numeric: tabular-nums;
}

.card-count--done {
  color: var(--success);
}

.blank {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-12) 0;
}

.blank-text {
  color: var(--text-muted);
}

.blank-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
</style>

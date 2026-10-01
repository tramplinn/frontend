<script setup lang="ts">
import type { Course } from '@/api/schemas/content'
import { hours } from '@/lib/hours'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ course: Course }>()
</script>

<template>
  <RouterLink :to="{ name: 'course', params: { course: props.course.slug } }" class="card">
    <span class="visual" aria-hidden="true">
      <img
        v-if="props.course.coverUrl"
        :src="props.course.coverUrl"
        alt=""
        width="960"
        height="640"
        loading="lazy"
        decoding="async"
        class="artwork"
      />
      <span v-else class="fallback">{{ props.course.title.slice(0, 1).toUpperCase() }}</span>
    </span>

    <span class="body">
      <span v-if="props.course.estHours !== null" class="meta">
        {{ hours(props.course.estHours) }}
      </span>
      <span class="title">{{ props.course.title }}</span>
      <span v-if="props.course.summary" class="summary">{{ props.course.summary }}</span>
    </span>

    <span class="action">{{ t('course.open') }}</span>
  </RouterLink>
</template>

<style scoped>
.card {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-4);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.card:hover {
  background: var(--card-hover);
  border-color: var(--accent);
}

.visual {
  display: block;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: var(--accent-soft);
  border-radius: var(--radius-ctl);
}

.artwork {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--accent);
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
}

.body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: var(--space-2);
}

.title {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
}

.summary {
  color: var(--text-muted);
  font-size: var(--text-caption);
  line-height: 1.5;
}

.meta {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.action {
  display: grid;
  place-items: center;
  min-width: 112px;
  height: var(--ctl-md);
  padding: 0 var(--space-6);
  background: var(--accent);
  border-radius: var(--radius-ctl);
  color: var(--on-accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  transition: background var(--motion-fast) var(--ease);
}

.card:hover .action {
  background: var(--accent-hover);
}

@media (max-width: 900px) {
  .card {
    grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  }

  .action {
    grid-column: 2;
    justify-self: start;
  }
}

@media (max-width: 620px) {
  .card {
    grid-template-columns: 1fr;
  }

  .action {
    grid-column: 1;
    width: 100%;
  }
}
</style>

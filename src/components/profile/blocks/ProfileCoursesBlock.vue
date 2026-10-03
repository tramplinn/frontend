<script setup lang="ts">
import type { PublicProfile } from '@/api/schemas/users'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <div class="courses">
    <h2>{{ t('profile.learningNow') }}</h2>
    <RouterLink
      v-for="course in profile.activeCourses"
      :key="course.slug"
      :to="{ name: 'course', params: { course: course.slug } }"
      class="course"
    >
      <span class="course-mark" :style="{ background: course.color ?? 'var(--accent)' }"></span>
      <span class="course-title">{{ course.title }}</span>
      <span class="course-progress">{{ course.completedLessons }}/{{ course.totalLessons }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.courses h2 {
  margin-bottom: var(--space-3);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}
.course {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}
.course + .course {
  margin-top: var(--space-2);
}
.course:hover {
  background: var(--surface-hover);
}
.course-mark {
  width: var(--space-2);
  height: var(--space-8);
  border-radius: var(--radius-pill);
}
.course-title {
  flex: 1;
  font-weight: var(--weight-medium);
}
.course-progress {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

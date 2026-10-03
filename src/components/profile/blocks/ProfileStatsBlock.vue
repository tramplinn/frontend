<script setup lang="ts">
import type { PublicProfile } from '@/api/schemas/users'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <dl class="stats">
    <div>
      <dt>{{ profile.completedLessons }}</dt>
      <dd>{{ t('profile.statLessons') }}</dd>
    </div>
    <div>
      <dt>{{ profile.passedQuizzes }}</dt>
      <dd>{{ t('profile.statQuizzes') }}</dd>
    </div>
    <div>
      <dt>{{ profile.solvedAlgorithms }}</dt>
      <dd>{{ t('profile.statProblems') }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
}
.stats div {
  padding: var(--space-4);
  text-align: center;
  border-right: 1px solid var(--border);
}
.stats div:last-child {
  border-right: 0;
}
.stats dt {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
}
.stats dd {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
@media (max-width: 620px) {
  .stats div {
    padding-inline: var(--space-2);
  }
  .stats dt {
    font-size: var(--text-title);
  }
}
</style>

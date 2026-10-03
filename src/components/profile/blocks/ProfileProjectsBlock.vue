<script setup lang="ts">
import type { PublicProfile } from '@/api/schemas/users'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <div class="projects">
    <h2>{{ t('profileBlocks.projects') }}</h2>
    <div class="grid">
      <ProjectCard
        v-for="project in profile.projects"
        :key="project.id"
        :project="project"
        :subtitle="project.memberTitle"
        compact
      />
    </div>
  </div>
</template>

<style scoped>
.projects h2 {
  margin-bottom: var(--space-3);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-3);
}
</style>

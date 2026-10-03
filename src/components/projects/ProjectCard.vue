<script setup lang="ts">
import type { ProjectCard } from '@/api/schemas/projects'
import ProjectLogo from '@/components/projects/ProjectLogo.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import { useI18n } from '@/i18n'
import { roleLabel, visibilityLabel } from '@/lib/projects'

const { tc } = useI18n()

withDefaults(
  defineProps<{
    project: ProjectCard
    subtitle?: string | null
    compact?: boolean
    showRole?: boolean
  }>(),
  { subtitle: null, compact: false, showRole: false },
)
</script>

<template>
  <RouterLink
    :to="{ name: 'project', params: { slug: project.slug } }"
    class="card"
    :class="{ 'card--compact': compact }"
  >
    <span class="top">
      <ProjectLogo :title="project.title" :url="project.logoUrl" :size="compact ? 36 : 48" />
      <span class="heading">
        <strong>{{ project.title }}</strong>
        <small v-if="subtitle">{{ subtitle }}</small>
      </span>
    </span>
    <span v-if="project.summary && !compact" class="summary">{{ project.summary }}</span>
    <span class="meta">
      <ProjectStatusBadge :status="project.status" />
      <span v-if="showRole && project.myRole" class="chip chip--role">{{
        roleLabel(project.myRole)
      }}</span>
      <span v-if="showRole && project.visibility !== 'public'" class="chip chip--role">{{
        visibilityLabel(project.visibility)
      }}</span>
      <span class="members">{{ tc('projects.membersCount', project.membersCount) }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  transition:
    background var(--motion-fast) var(--ease),
    transform var(--motion-fast) var(--ease);
}
.card:hover {
  background: var(--card-hover);
  transform: translateY(-1px);
}
.card--compact {
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface);
}
.top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}
.heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.heading strong,
.heading small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.heading small,
.summary,
.members {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.summary {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: auto;
}
.chip--role {
  background: var(--surface);
  color: var(--text-muted);
}
.members {
  margin-left: auto;
}
</style>

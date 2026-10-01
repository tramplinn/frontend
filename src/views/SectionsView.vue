<script setup lang="ts">
import { computed } from 'vue'

import SectionIcon from '@/components/layout/SectionIcon.vue'
import { useI18n } from '@/i18n'
import type { Section } from '@/lib/sections'
import { visibleSections } from '@/lib/sections'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { t } = useI18n()

const groups = computed(() => {
  const byGroup = new Map<Section['group'], Section[]>()
  for (const section of visibleSections({
    isTeacher: auth.isTeacher,
    isAdmin: auth.isAdmin,
  })) {
    byGroup.set(section.group, [...(byGroup.get(section.group) ?? []), section])
  }
  return [...byGroup.entries()]
})
</script>

<template>
  <section>
    <h1 class="heading">{{ t('nav.allSections') }}</h1>

    <div v-for="[group, items] in groups" :key="group" class="block">
      <h2 class="block-title">{{ t(`sections.groups.${group}`) }}</h2>
      <div class="grid">
        <RouterLink v-for="section in items" :key="section.key" :to="section.to" class="tile">
          <SectionIcon :name="section.key" />
          <span class="tile-copy">
            <span class="tile-title">{{ t(`sections.${section.messages}.title`) }}</span>
            <span class="tile-summary">{{ t(`sections.${section.messages}.summary`) }}</span>
          </span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.heading {
  margin-bottom: var(--space-8);
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
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
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: var(--space-4);
  max-width: 880px;
}

.tile {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  transition:
    background var(--motion-fast) var(--ease),
    border-color var(--motion-fast) var(--ease);
}

.tile-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.tile:hover {
  background: var(--card-hover);
  border-color: var(--text-muted);
}

.tile-title {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
}

.tile-summary {
  color: var(--text-muted);
  font-size: var(--text-caption);
  line-height: 1.5;
}
</style>

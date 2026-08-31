<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import BrandMark from '@/components/layout/BrandMark.vue'
import SectionIcon from '@/components/layout/SectionIcon.vue'
import type { Section } from '@/lib/sections'
import { visibleSections } from '@/lib/sections'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'

const auth = useAuthStore()
const content = useContentStore()
const progress = useProgressStore()
const route = useRoute()
const mobileOpen = ref(false)

const sections = computed(() =>
  visibleSections({ isTeacher: auth.isTeacher, isAdmin: auth.isAdmin }),
)

const groups = computed(() => {
  const byGroup = new Map<Section['group'], Section[]>()
  for (const section of sections.value) {
    byGroup.set(section.group, [...(byGroup.get(section.group) ?? []), section])
  }
  return [...byGroup.entries()]
})

const started = computed(() => progress.startedCourses)

onMounted(() => {
  void content.loadTracks().catch(() => {})
})

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': mobileOpen }">
    <div class="sidebar-head">
      <RouterLink :to="{ name: 'home' }" class="brand">
        <BrandMark />
        <span>трамплин</span>
      </RouterLink>

      <button
        type="button"
        class="menu-toggle"
        aria-controls="sidebar-navigation"
        :aria-expanded="mobileOpen"
        @click="mobileOpen = !mobileOpen"
      >
        {{ mobileOpen ? 'закрыть' : 'меню' }}
      </button>
    </div>

    <div id="sidebar-navigation" class="sidebar-content">
      <RouterLink v-if="auth.isAuthenticated && auth.user" :to="{ name: 'profile' }" class="me">
        <AvatarRoot class="avatar">
          <AvatarImage
            v-if="auth.user.avatarUrl"
            :src="auth.user.avatarUrl"
            :alt="auth.displayName"
            class="avatar-image"
          />
          <AvatarFallback class="avatar-fallback">
            {{ auth.displayName.slice(0, 1).toUpperCase() }}
          </AvatarFallback>
        </AvatarRoot>
        <span class="me-text">
          <span class="me-name">{{ auth.displayName }}</span>
          <span class="me-login">{{ auth.user.login }}</span>
        </span>
      </RouterLink>

      <RouterLink :to="{ name: 'sections' }" class="launcher">
        <svg class="launcher-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <rect class="launcher-accent" x="2" y="2" width="6" height="6" rx="2" />
          <rect class="launcher-warning" x="12" y="2" width="6" height="6" rx="2" />
          <rect class="launcher-success" x="2" y="12" width="6" height="6" rx="2" />
          <rect class="launcher-purple" x="12" y="12" width="6" height="6" rx="2" />
        </svg>
        все разделы
      </RouterLink>

      <div v-for="[group, items] in groups" :key="group" class="group">
        <p class="group-title">{{ group }}</p>
        <nav class="nav" :aria-label="group">
          <RouterLink v-for="section in items" :key="section.key" :to="section.to" class="item">
            <SectionIcon :name="section.key" />
            <span class="item-title">{{ section.title }}</span>
          </RouterLink>
        </nav>
      </div>

      <div v-if="started.length > 0" class="group">
        <p class="group-title">продолжить</p>
        <nav class="nav" aria-label="Продолжить обучение">
          <RouterLink
            v-for="course in started"
            :key="course.slug"
            :to="{ name: 'course', params: { course: course.slug } }"
            class="item"
          >
            <span class="mark" :class="{ 'mark--done': course.completed === course.total }" />
            <span class="item-title">{{ course.title }}</span>
            <span class="item-tail">{{ course.completed }}/{{ course.total }}</span>
          </RouterLink>
        </nav>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  flex-shrink: 0;
  width: var(--sidebar);
  min-height: 100dvh;
  padding: var(--space-6) var(--space-4);
  background: var(--card);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.sidebar-head,
.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.menu-toggle {
  display: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  color: var(--accent);
}

.me {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  transition: background var(--motion-fast) var(--ease);
}

.me:hover,
.me.router-link-active {
  background: var(--surface);
}

.avatar {
  display: block;
  flex-shrink: 0;
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--surface);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}

.me-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.me-name,
.me-login {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-caption);
}

.me-name {
  font-weight: var(--weight-medium);
}

.me-login {
  color: var(--text-muted);
}

.launcher {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  color: var(--text);
  transition: background var(--motion-fast) var(--ease);
}

.launcher-icon {
  flex-shrink: 0;
}

.launcher-accent {
  fill: var(--accent);
}

.launcher-warning {
  fill: var(--warning);
}

.launcher-success {
  fill: var(--success);
}

.launcher-purple {
  fill: var(--icon-purple);
}

.launcher:hover,
.launcher.router-link-active {
  background: var(--surface);
}

.group-title {
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  font-size: var(--text-caption);
  color: var(--text-muted);
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.item:hover {
  background: var(--surface);
  color: var(--text);
}

.item.router-link-exact-active {
  background: var(--surface);
  color: var(--text);
  font-weight: var(--weight-medium);
}

.item-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-tail {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--text-caption);
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.mark {
  flex-shrink: 0;
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-xs);
  background: var(--accent);
}

.mark--done {
  background: var(--success);
}

@media (max-width: 800px) {
  .sidebar {
    position: static;
    width: 100%;
    min-height: 0;
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: var(--space-4);
  }

  .sidebar-head {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--ctl-sm);
    padding: 0 var(--space-4);
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--surface);
    color: var(--text-muted);
    font-size: var(--text-caption);
    cursor: pointer;
  }

  .menu-toggle:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  .sidebar:not(.sidebar--open) .sidebar-content {
    display: none;
  }
}
</style>

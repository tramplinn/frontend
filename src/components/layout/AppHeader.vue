<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useRoute } from 'vue-router'

import SignInButton from '@/components/layout/SignInButton.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import { authNextPath } from '@/lib/authNavigation'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'

interface Crumb {
  label: string
  to: RouteLocationRaw | null
}

const auth = useAuthStore()
const content = useContentStore()
const route = useRoute()

const nextPath = computed(() => authNextPath(route.fullPath, route.query.login))

function param(name: string): string {
  const value = route.params[name]
  return typeof value === 'string' ? value : ''
}

const SIMPLE_LABELS: Record<string, string> = {
  sections: 'все разделы',
  catalog: 'курсы',
  profile: 'профиль',
  'manage-content': 'контент',
  'manage-lesson': 'контент / урок',
  'manage-quiz': 'контент / тест',
  'admin-users': 'пользователи',
}

const crumbs = computed<Crumb[]>(() => {
  const trail: Crumb[] = [{ label: 'главная', to: { name: 'home' } }]
  const courseSlug = param('course')
  if (!courseSlug) {
    const name = typeof route.name === 'string' ? route.name : ''
    const label = SIMPLE_LABELS[name]
    if (label !== undefined) {
      trail.push({ label, to: null })
    }
    return trail
  }

  trail.push({ label: 'курсы', to: { name: 'catalog' } })
  const course = content.courses.get(courseSlug)
  trail.push({
    label: course?.title.toLowerCase() ?? courseSlug,
    to: { name: 'course', params: { course: courseSlug } },
  })

  const found =
    route.name === 'lesson'
      ? content.findLesson(courseSlug, param('module'), param('lesson'))
      : route.name === 'quiz'
        ? content.findQuiz(courseSlug, param('module'), param('quiz'))
        : null
  if (found) {
    trail.push({ label: found.module.title.toLowerCase(), to: null })
    trail.push({
      label: ('lesson' in found ? found.lesson.title : found.quiz.title).toLowerCase(),
      to: null,
    })
  }
  return trail
})
</script>

<template>
  <header class="header">
    <nav class="crumbs" aria-label="Хлебные крошки">
      <template v-for="(crumb, index) in crumbs" :key="crumb.label + String(index)">
        <span v-if="index > 0" class="sep" aria-hidden="true">/</span>
        <RouterLink v-if="crumb.to" :to="crumb.to" class="crumb">{{ crumb.label }}</RouterLink>
        <span v-else class="crumb crumb--current" aria-current="page">{{ crumb.label }}</span>
      </template>
    </nav>

    <div class="side">
      <ThemeToggle />
      <SignInButton v-if="!auth.isAuthenticated" size="sm" :next-path="nextPath" />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: var(--topbar);
  padding: 0 var(--space-8);
}

.crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  overflow: hidden;
}

.crumb {
  color: var(--text-muted);
  font-size: var(--text-caption);
  white-space: nowrap;
  transition: color var(--motion-fast) var(--ease);
}

a.crumb:hover {
  color: var(--text);
}

.crumb--current {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.sep {
  color: var(--border);
  font-size: var(--text-caption);
}

.side {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.sign-in-error {
  color: var(--danger);
  font-size: var(--text-caption);
  white-space: nowrap;
}

@media (max-width: 520px) {
  .header {
    padding-inline: var(--space-4);
  }

  .sign-in-error {
    position: absolute;
    z-index: 10;
    top: calc(100% + var(--space-2));
    right: var(--space-4);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-ctl);
    background: var(--danger-soft);
  }
}
</style>

<script setup lang="ts">
import { Mail } from '@lucide/vue'
import { computed, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'

import SignInButton from '@/components/layout/SignInButton.vue'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import type { MessageKey } from '@/i18n'
import { localeSwitcherEnabled, useI18n } from '@/i18n'
import { authNextPath } from '@/lib/authNavigation'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useProjectInvitesStore } from '@/stores/projectInvites'

interface Crumb {
  label: string
  to: RouteLocationRaw | null
}

const auth = useAuthStore()
const content = useContentStore()
const route = useRoute()
const router = useRouter()
const { t, tc } = useI18n()
const invites = useProjectInvitesStore()

// Внутриплатформенных уведомлений нет: входящие приглашения — счётчик в шапке.
watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (!signedIn) invites.reset()
    else if (!invites.loaded) void invites.load().catch(() => {})
  },
  { immediate: true },
)

const nextPath = computed(() => authNextPath(route.fullPath, route.query.login))
/** Гард роутера кладёт сюда закрытую страницу, куда гость пытался попасть. */
const loginRequested = computed(() => typeof route.query.login === 'string')

function dropLoginQuery(): void {
  if (!loginRequested.value) return
  const query = { ...route.query }
  delete query.login
  void router.replace({ query })
}

function param(name: string): string {
  const value = route.params[name]
  return typeof value === 'string' ? value : ''
}

const SIMPLE_LABELS: Record<string, MessageKey> = {
  sections: 'nav.crumbs.sections',
  learning: 'nav.crumbs.learning',
  algorithms: 'nav.crumbs.algorithms',
  'algorithm-solo': 'nav.crumbs.algorithmProblem',
  'manage-algorithms': 'nav.crumbs.algorithmProblems',
  'manage-algorithm': 'nav.crumbs.algorithmProblem',
  'manage-practice-set': 'nav.crumbs.practice',
  'news-item': 'nav.crumbs.newsItem',
  catalog: 'nav.crumbs.catalog',
  profile: 'nav.crumbs.profile',
  people: 'nav.crumbs.people',
  'user-profile': 'nav.crumbs.profile',
  projects: 'nav.crumbs.projects',
  'project-create': 'nav.crumbs.projectNew',
  project: 'nav.crumbs.project',
  'project-settings': 'nav.crumbs.projectSettings',
  'manage-content': 'nav.crumbs.content',
  'manage-lesson': 'nav.crumbs.contentLesson',
  'manage-quiz': 'nav.crumbs.contentQuiz',
  'manage-news': 'nav.crumbs.news',
  'manage-news-item': 'nav.crumbs.newsArticle',
  'admin-users': 'nav.crumbs.users',
  'mcp-authorize': 'nav.crumbs.mcpAuthorization',
  'not-found': 'nav.crumbs.notFound',
}

interface ParentCrumb {
  label: MessageKey
  name: string
  param?: string
}

const PARENT_CRUMBS: Record<string, ParentCrumb[]> = {
  'user-profile': [{ label: 'nav.crumbs.people', name: 'people' }],
  'algorithm-solo': [{ label: 'nav.crumbs.algorithms', name: 'algorithms' }],
  'manage-algorithm': [{ label: 'nav.crumbs.algorithmProblems', name: 'manage-algorithms' }],
  'manage-practice-set': [{ label: 'nav.crumbs.content', name: 'manage-content' }],
  'manage-lesson': [{ label: 'nav.crumbs.content', name: 'manage-content' }],
  'manage-quiz': [{ label: 'nav.crumbs.content', name: 'manage-content' }],
  'manage-news-item': [{ label: 'nav.crumbs.news', name: 'manage-news' }],
  'project-create': [{ label: 'nav.crumbs.projects', name: 'projects' }],
  project: [{ label: 'nav.crumbs.projects', name: 'projects' }],
  'project-settings': [
    { label: 'nav.crumbs.projects', name: 'projects' },
    { label: 'nav.crumbs.project', name: 'project', param: 'slug' },
  ],
}

const crumbs = computed<Crumb[]>(() => {
  const trail: Crumb[] = [
    { label: t('nav.home'), to: route.name === 'home' ? null : { name: 'home' } },
  ]
  const courseSlug = param('course')
  if (!courseSlug) {
    const name = typeof route.name === 'string' ? route.name : ''
    for (const parent of PARENT_CRUMBS[name] ?? []) {
      trail.push({
        label: t(parent.label),
        to: {
          name: parent.name,
          ...(parent.param ? { params: { [parent.param]: param(parent.param) } } : {}),
        },
      })
    }
    const label = SIMPLE_LABELS[name]
    if (label !== undefined) {
      trail.push({ label: t(label), to: null })
    }
    return trail
  }

  trail.push({ label: t('nav.crumbs.catalog'), to: { name: 'catalog' } })
  const course = content.courses.get(courseSlug)
  trail.push({
    label: course?.title.toLowerCase() ?? courseSlug,
    to: route.name === 'course' ? null : { name: 'course', params: { course: courseSlug } },
  })

  const found =
    route.name === 'lesson'
      ? content.findLesson(courseSlug, param('module'), param('lesson'))
      : route.name === 'quiz'
        ? content.findQuiz(courseSlug, param('module'), param('quiz'))
        : route.name === 'algorithm-practice'
          ? content.findPracticeSet(courseSlug, param('module'), param('set'))
          : null
  if (found) {
    trail.push({ label: found.module.title.toLowerCase(), to: null })
    trail.push({
      label: ('lesson' in found
        ? found.lesson.title
        : 'quiz' in found
          ? found.quiz.title
          : found.practiceSet.title
      ).toLowerCase(),
      to: null,
    })
  } else if (route.name !== 'course') {
    const item = param('lesson') || param('quiz') || param('set')
    trail.push({ label: param('module'), to: null })
    trail.push({ label: item, to: null })
  }
  return trail
})
</script>

<template>
  <header class="header">
    <nav class="crumbs" :aria-label="t('nav.breadcrumbs')">
      <template v-for="(crumb, index) in crumbs" :key="crumb.label + String(index)">
        <span v-if="index > 0" class="sep" aria-hidden="true">/</span>
        <RouterLink v-if="crumb.to" :to="crumb.to" class="crumb" :title="crumb.label">{{
          crumb.label
        }}</RouterLink>
        <span
          v-else
          class="crumb"
          :title="crumb.label"
          :class="{ 'crumb--current': index === crumbs.length - 1 }"
          :aria-current="index === crumbs.length - 1 ? 'page' : undefined"
          >{{ crumb.label }}</span
        >
      </template>
    </nav>

    <div class="side">
      <LocaleSwitcher v-if="localeSwitcherEnabled" />
      <ThemeToggle />
      <RouterLink
        v-if="auth.isAuthenticated && invites.count > 0"
        :to="{ name: 'profile' }"
        class="invites"
        :aria-label="tc('invites.badge', invites.count)"
        :title="tc('invites.badge', invites.count)"
        ><Mail :size="16" aria-hidden="true" /><span class="count">{{
          invites.count
        }}</span></RouterLink
      >
      <SignInButton
        v-if="auth.status === 'ready' && !auth.isAuthenticated"
        size="sm"
        :next-path="nextPath"
        :auto-open="loginRequested"
        @close="dropLoginQuery"
      />
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
  min-width: 2ch;
  max-width: 28ch;
  overflow: hidden;
  text-overflow: ellipsis;
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
  flex-shrink: 0;
  color: var(--border);
  font-size: var(--text-caption);
}

.side {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.invites {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: var(--ctl-sm);
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
}

@media (max-width: 520px) {
  .header {
    padding-inline: var(--space-4);
  }
}
</style>

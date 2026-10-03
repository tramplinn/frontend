<script setup lang="ts">
import { Settings } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import { changeProjectStatus, getProject, listStatusEvents } from '@/api/projects'
import type { Project, ProjectStatus, ProjectStatusEvent } from '@/api/schemas/projects'
import LessonBody from '@/components/lesson/LessonBody.vue'
import ProjectLinkIcon from '@/components/projects/ProjectLinkIcon.vue'
import ProjectLogo from '@/components/projects/ProjectLogo.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useVersionedLoad } from '@/composables/useVersionedLoad'
import { useI18n } from '@/i18n'
import { errorText } from '@/lib/errors'
import { renderReadme } from '@/lib/markdown'
import {
  PROJECT_STATUSES,
  canEditContent,
  canManageProject,
  linkKindLabel,
  roleLabel,
  statusLabel,
  visibilityLabel,
} from '@/lib/projects'

const { t, d } = useI18n()
const props = defineProps<{ slug: string }>()

const project = ref<Project | null>(null)
const pending = ref(true)
const error = ref<unknown>(null)
const statusError = ref<string | null>(null)
const changingStatus = ref(false)
const events = ref<ProjectStatusEvent[] | null>(null)

const readmeHtml = computed(() => (project.value ? renderReadme(project.value.readmeMd) : ''))
const statusOptions = computed(() =>
  PROJECT_STATUSES.map((value) => ({ value, label: statusLabel(value) })),
)

/* При переходе с проекта на проект ответ по старому slug может прийти позже
   нового и показать чужой проект — все ответы сверяем с текущей загрузкой. */
const loadGuard = useVersionedLoad()

async function load(): Promise<void> {
  const version = loadGuard.start()
  pending.value = true
  error.value = null
  events.value = null
  try {
    const loaded = await getProject(props.slug)
    if (loadGuard.isCurrent(version)) project.value = loaded
  } catch (cause) {
    if (loadGuard.isCurrent(version)) error.value = cause
  } finally {
    if (loadGuard.isCurrent(version)) pending.value = false
  }
}

async function setStatus(status: ProjectStatus): Promise<void> {
  if (!project.value || project.value.status === status) return
  const version = loadGuard.peek()
  changingStatus.value = true
  statusError.value = null
  try {
    const updated = await changeProjectStatus(props.slug, status)
    if (!loadGuard.isCurrent(version)) return
    project.value = updated
    if (events.value) {
      const history = await listStatusEvents(props.slug)
      if (loadGuard.isCurrent(version)) events.value = history
    }
  } catch (cause) {
    if (loadGuard.isCurrent(version)) statusError.value = errorText(cause)
  } finally {
    changingStatus.value = false
  }
}

/** История свёрнута по умолчанию — грузим её только при раскрытии. */
async function toggleHistory(event: Event): Promise<void> {
  if ((event.target as HTMLDetailsElement).open && events.value === null) {
    const version = loadGuard.peek()
    const history = await listStatusEvents(props.slug).catch(() => [])
    if (loadGuard.isCurrent(version)) events.value = history
  }
}

watch(
  () => props.slug,
  () => void load(),
  { immediate: true },
)
</script>

<template>
  <BackLink :to="{ name: 'projects' }" class="back">{{ t('projects.back') }}</BackLink>
  <LoadState :pending="pending" :error="error" @retry="load">
    <article v-if="project" class="project">
      <header class="head">
        <ProjectLogo :title="project.title" :url="project.logoUrl" :size="72" />
        <div class="identity">
          <h1>{{ project.title }}</h1>
          <p v-if="project.summary" class="summary">{{ project.summary }}</p>
          <div class="badges">
            <AppSelect
              v-if="canManageProject(project.myRole)"
              class="status-select"
              :model-value="project.status"
              :options="statusOptions"
              :label="t('projects.fields.status')"
              :disabled="changingStatus"
              @update:model-value="(value: ProjectStatus) => setStatus(value)"
            />
            <ProjectStatusBadge v-else :status="project.status" />
            <span v-if="project.myRole" class="chip chip--muted">{{
              visibilityLabel(project.visibility)
            }}</span>
            <span v-if="project.myRole" class="chip chip--muted">{{
              t('projects.yourRole', { role: roleLabel(project.myRole) })
            }}</span>
          </div>
          <p v-if="statusError" class="error" role="alert">{{ statusError }}</p>
        </div>
        <RouterLink
          v-if="canEditContent(project.myRole)"
          :to="{ name: 'project-settings', params: { slug: project.slug } }"
          class="settings"
          ><Settings :size="16" aria-hidden="true" />{{ t('projects.settings.open') }}</RouterLink
        >
      </header>

      <div class="columns">
        <section class="readme card">
          <LessonBody v-if="project.readmeMd.trim()" :html="readmeHtml" />
          <div v-else-if="canEditContent(project.myRole)" class="readme-empty">
            <p>{{ t('projects.readme.emptyOwn') }}</p>
            <RouterLink
              :to="{
                name: 'project-settings',
                params: { slug: project.slug },
                query: { tab: 'readme' },
              }"
              class="cta"
              >{{ t('projects.readme.write') }}</RouterLink
            >
          </div>
          <p v-else class="muted">{{ t('projects.readme.empty') }}</p>
        </section>

        <aside class="side">
          <section v-if="project.links.length" class="card">
            <h2>{{ t('projects.links.heading') }}</h2>
            <ul class="links">
              <li v-for="link in project.links" :key="link.id">
                <a :href="link.url" target="_blank" rel="nofollow noopener noreferrer">
                  <ProjectLinkIcon :kind="link.kind" :url="link.url" />
                  <span>{{ link.label || linkKindLabel(link.kind) }}</span>
                </a>
              </li>
            </ul>
          </section>

          <section class="card">
            <h2>{{ t('projects.team.heading') }}</h2>
            <ul class="team">
              <li v-for="member in project.members" :key="member.userId">
                <RouterLink :to="{ name: 'user-profile', params: { login: member.login } }">
                  <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.login" />
                  <span v-else class="fallback">{{
                    (member.name ?? member.login).slice(0, 1).toUpperCase()
                  }}</span>
                  <span class="person">
                    <strong>{{ member.name ?? member.login }}</strong>
                    <small>{{
                      [member.title, roleLabel(member.role)].filter(Boolean).join(' · ')
                    }}</small>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <details class="card history" @toggle="toggleHistory">
            <summary>{{ t('projects.history.heading') }}</summary>
            <p v-if="events === null" class="muted">{{ t('projects.history.loading') }}</p>
            <ol v-else class="events">
              <li v-for="event in events" :key="event.id">
                <ProjectStatusBadge :status="event.toStatus" />
                <small
                  >{{ d(event.createdAt, { dateStyle: 'medium' })
                  }}{{ event.actorLogin ? ` · @${event.actorLogin}` : '' }}</small
                >
              </li>
            </ol>
          </details>
        </aside>
      </div>
    </article>
  </LoadState>
</template>

<style scoped>
.back {
  display: inline-flex;
  margin-bottom: var(--space-6);
}
.project {
  display: grid;
  gap: var(--space-6);
  max-width: 1100px;
}
.head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}
.identity {
  display: grid;
  flex: 1;
  gap: var(--space-2);
  min-width: 0;
}
h1 {
  font-size: var(--text-display);
  line-height: 1.15;
  letter-spacing: -0.03em;
}
.summary,
.muted,
.team small,
.events small {
  color: var(--text-muted);
}
.badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
.status-select {
  min-width: 180px;
}
.chip--muted {
  background: var(--surface);
  color: var(--text-muted);
}
.settings {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.settings:hover {
  color: var(--text);
}
.columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: var(--space-6);
  align-items: start;
}
.card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}
.side {
  display: grid;
  gap: var(--space-4);
}
.side .card {
  padding: var(--space-4);
}
h2,
.history summary {
  margin-bottom: var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
.history summary {
  margin-bottom: 0;
  cursor: pointer;
}
.history[open] summary {
  margin-bottom: var(--space-3);
}
.links,
.team,
.events {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}
.links a,
.team a {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-2);
  border-radius: var(--radius-ctl);
}
.links a:hover,
.team a:hover {
  background: var(--surface);
}
.team img,
.fallback {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  object-fit: cover;
}
.fallback {
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: var(--weight-semibold);
}
.person {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.person strong,
.person small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.team small,
.events small,
.muted {
  font-size: var(--text-caption);
}
.events li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.readme-empty {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
  padding: var(--space-6) 0;
}
.cta {
  color: var(--accent);
  font-weight: var(--weight-medium);
}
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
@media (max-width: 900px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 620px) {
  .head {
    flex-wrap: wrap;
  }
  .card {
    padding: var(--space-4);
  }
}
</style>

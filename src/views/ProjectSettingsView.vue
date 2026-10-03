<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { ProjectLinkKind, ProjectRole, ProjectVisibility } from '@/api/schemas/projects'
import CoverField from '@/components/manage/CoverField.vue'
import MarkdownEditor from '@/components/manage/MarkdownEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import BackLink from '@/components/ui/BackLink.vue'
import ComboInput from '@/components/ui/ComboInput.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import FilterChip from '@/components/ui/FilterChip.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useLoginSuggestions } from '@/features/projects/composables/useLoginSuggestions'
import { useProjectSettings } from '@/features/projects/composables/useProjectSettings'
import type { SettingsTab } from '@/features/projects/composables/useProjectSettings'
import { useI18n } from '@/i18n'
import { renderReadme } from '@/lib/markdown'
import {
  MAX_PROJECT_LINKS,
  PROJECT_LINK_KINDS,
  PROJECT_ROLES,
  PROJECT_VISIBILITIES,
  README_MAX_LENGTH,
  canEditContent,
  canManageProject,
  hasRole,
  isOwner,
  linkKindLabel,
  roleLabel,
  rolesBelow,
  visibilityHint,
  visibilityLabel,
} from '@/lib/projects'
import { useAuthStore } from '@/stores/auth'

const { t, d, n } = useI18n()
const props = defineProps<{ slug: string }>()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const settings = useProjectSettings(() => props.slug)
const {
  project,
  invites,
  pending,
  loadError,
  busy,
  error,
  saved,
  main,
  readme,
  links,
  invite,
  deleteConfirm,
  transferLogin,
  role,
  tabs,
  archived,
  readmeTooLong,
  linksError,
} = settings
const loginSuggestions = useLoginSuggestions(computed(() => invite.value.login))

const tab = computed<SettingsTab>(() => {
  const requested = route.query.tab
  return tabs.value.find((item) => item === requested) ?? 'main'
})
const readmeHtml = computed(() => renderReadme(readme.value))
const visibilityOptions = computed(() =>
  PROJECT_VISIBILITIES.map((value) => ({ value, label: visibilityLabel(value) })),
)
const linkKindOptions = computed(() =>
  PROJECT_LINK_KINDS.map((value) => ({ value, label: linkKindLabel(value) })),
)
const inviteRoleOptions = computed(() =>
  rolesBelow(role.value).map((value) => ({ value, label: roleLabel(value) })),
)
const memberRoleOptions = computed(() =>
  PROJECT_ROLES.filter((value) => value !== 'owner').map((value) => ({
    value,
    label: roleLabel(value),
  })),
)
const transferCandidates = computed(() =>
  (project.value?.members ?? [])
    .filter((member) => member.role !== 'owner')
    .map((member) => ({ value: member.login, label: member.name ?? member.login })),
)
const myLogin = computed(() => auth.user?.login ?? '')

function openTab(next: SettingsTab): void {
  void router.replace({ query: next === 'main' ? {} : { tab: next } })
}

/** Исключить можно себя (выход) или участника строго ниже своей роли. */
function canRemove(memberRole: ProjectRole, login: string): boolean {
  if (memberRole === 'owner') return false
  if (login === myLogin.value) return true
  return canManageProject(role.value) && rolesBelow(role.value).includes(memberRole)
}

function canEditTitle(login: string): boolean {
  return login === myLogin.value || canManageProject(role.value)
}

watch(
  () => props.slug,
  () => void settings.load(),
  { immediate: true },
)
watch(
  () => inviteRoleOptions.value,
  (options) => {
    const fallback = options.at(-1)
    if (fallback && !options.some((item) => item.value === invite.value.role)) {
      invite.value = { ...invite.value, role: fallback.value }
    }
  },
)
</script>

<template>
  <BackLink :to="{ name: 'project', params: { slug: props.slug } }" class="back">{{
    t('projects.settings.backToProject')
  }}</BackLink>
  <LoadState :pending="pending" :error="loadError" @retry="settings.load">
    <section v-if="project" class="settings">
      <header class="head">
        <h1>{{ t('projects.settings.heading', { title: project.title }) }}</h1>
        <p v-if="!canEditContent(role)" class="warning">{{ t('projects.settings.readOnly') }}</p>
        <p v-else-if="archived" class="warning">{{ t('projects.settings.archived') }}</p>
      </header>

      <nav class="tabs" :aria-label="t('projects.settings.tabsLabel')">
        <FilterChip
          v-for="item in tabs"
          :key="item"
          :pressed="tab === item"
          @click="openTab(item)"
          >{{ t(`projects.settings.tabs.${item}`) }}</FilterChip
        >
      </nav>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else-if="saved" class="saved" role="status">{{ saved }}</p>

      <form v-if="tab === 'main'" class="card form" @submit.prevent="settings.saveMain">
        <template v-if="canManageProject(role)">
          <label
            ><span>{{ t('projects.fields.title') }}</span
            ><input v-model="main.title" class="text-field" maxlength="120" required
          /></label>
          <label
            ><span>{{ t('projects.fields.slug') }}</span
            ><input
              v-model="main.slug"
              class="text-field mono"
              maxlength="80"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            /><small class="hint">{{ t('projects.fields.slugHint') }}</small></label
          >
          <label
            ><span>{{ t('projects.fields.visibility') }}</span
            ><AppSelect
              :model-value="main.visibility"
              :options="visibilityOptions"
              :label="t('projects.fields.visibility')"
              @update:model-value="(value: ProjectVisibility) => (main.visibility = value)"
            /><small class="hint">{{ visibilityHint(main.visibility) }}</small></label
          >
        </template>
        <label
          ><span>{{ t('projects.fields.summary') }}</span
          ><textarea v-model="main.summary" class="text-field" rows="3" maxlength="280"></textarea>
        </label>
        <CoverField
          v-model:asset-id="main.logoAssetId"
          v-model:url="main.logoUrl"
          :alt="main.title"
          :label="t('projects.fields.logo')"
        />
        <AppButton
          type="submit"
          variant="primary"
          :loading="busy === 'main'"
          :disabled="archived"
          >{{ t('projects.settings.save') }}</AppButton
        >
      </form>

      <form v-else-if="tab === 'readme'" class="readme" @submit.prevent="settings.saveReadme">
        <MarkdownEditor
          v-model="readme"
          :html="readmeHtml"
          :source-label="t('projects.readme.source')"
          :empty-text="t('projects.readme.placeholder')"
          min-height="50vh"
        >
          <template #source-meta>
            <span class="counter" :class="{ 'counter--over': readmeTooLong }"
              >{{ n(readme.length) }} / {{ n(README_MAX_LENGTH) }}</span
            >
          </template>
        </MarkdownEditor>
        <AppButton
          type="submit"
          variant="primary"
          :loading="busy === 'readme'"
          :disabled="readmeTooLong || archived"
          >{{ t('projects.readme.save') }}</AppButton
        >
      </form>

      <form v-else-if="tab === 'links'" class="card form" @submit.prevent="settings.saveLinks">
        <p class="hint">{{ t('projects.links.hint', { max: MAX_PROJECT_LINKS }) }}</p>
        <ol class="link-rows">
          <li v-for="(row, index) in links" :key="row.key" class="link-row">
            <AppSelect
              :model-value="row.kind"
              :options="linkKindOptions"
              :label="t('projects.links.kind')"
              @update:model-value="(value: ProjectLinkKind) => (row.kind = value)"
            />
            <input
              v-model="row.url"
              class="text-field"
              type="url"
              maxlength="2048"
              placeholder="https://"
              :aria-label="t('projects.links.url')"
              required
            />
            <input
              v-model="row.label"
              class="text-field"
              maxlength="120"
              :placeholder="t('projects.links.label')"
              :aria-label="t('projects.links.label')"
            />
            <span class="row-actions">
              <AppButton
                size="sm"
                variant="quiet"
                :disabled="index === 0"
                :aria-label="t('projects.moveUp')"
                @click="settings.moveLink(index, -1)"
                ><ArrowUp :size="14"
              /></AppButton>
              <AppButton
                size="sm"
                variant="quiet"
                :disabled="index === links.length - 1"
                :aria-label="t('projects.moveDown')"
                @click="settings.moveLink(index, 1)"
                ><ArrowDown :size="14"
              /></AppButton>
              <AppButton
                size="sm"
                variant="quiet"
                :aria-label="t('projects.links.remove')"
                @click="settings.removeLink(index)"
                ><Trash2 :size="14"
              /></AppButton>
            </span>
          </li>
        </ol>
        <p v-if="links.length && linksError" class="error">{{ linksError }}</p>
        <div class="actions">
          <AppButton
            size="sm"
            :disabled="links.length >= MAX_PROJECT_LINKS"
            @click="settings.addLink"
            ><Plus :size="14" />{{ t('projects.links.add') }}</AppButton
          >
          <AppButton
            type="submit"
            variant="primary"
            :loading="busy === 'links'"
            :disabled="linksError !== null || archived"
            >{{ t('projects.links.save') }}</AppButton
          >
        </div>
      </form>

      <div v-else-if="tab === 'members'" class="members">
        <section class="card">
          <h2>{{ t('projects.team.heading') }}</h2>
          <ul class="member-rows">
            <li v-for="member in project.members" :key="member.userId" class="member-row">
              <RouterLink
                :to="{ name: 'user-profile', params: { login: member.login } }"
                class="person"
              >
                <strong>{{ member.name ?? member.login }}</strong>
                <small
                  >@{{ member.login }} · {{ d(member.joinedAt, { dateStyle: 'medium' }) }}</small
                >
              </RouterLink>
              <input
                class="text-field"
                maxlength="80"
                :value="member.title ?? ''"
                :placeholder="t('projects.team.titlePlaceholder')"
                :aria-label="t('projects.team.title')"
                :disabled="!canEditTitle(member.login)"
                @change="
                  settings.changeMember(member.login, {
                    title: ($event.target as HTMLInputElement).value.trim() || null,
                  })
                "
              />
              <AppSelect
                v-if="isOwner(role) && member.role !== 'owner'"
                :model-value="member.role"
                :options="memberRoleOptions"
                :label="t('projects.team.role')"
                @update:model-value="
                  (value: ProjectRole) => settings.changeMember(member.login, { role: value })
                "
              />
              <span v-else class="chip chip--muted">{{ roleLabel(member.role) }}</span>
              <ConfirmButton
                v-if="canRemove(member.role, member.login)"
                :label="
                  member.login === myLogin ? t('projects.team.leave') : t('projects.team.remove')
                "
                :confirm-label="t('projects.team.confirm')"
                :loading="busy === `remove:${member.login}`"
                @confirm="
                  settings.removeMember(member.login, { leaving: member.login === myLogin })
                "
              />
            </li>
          </ul>
        </section>

        <section v-if="canManageProject(role)" class="card">
          <h2>{{ t('projects.invites.heading') }}</h2>
          <form class="invite-form" @submit.prevent="settings.sendInvite">
            <ComboInput
              v-model="invite.login"
              :suggestions="loginSuggestions"
              :placeholder="t('projects.invites.login')"
            />
            <AppSelect
              :model-value="invite.role"
              :options="inviteRoleOptions"
              :label="t('projects.team.role')"
              @update:model-value="(value: ProjectRole) => (invite.role = value)"
            />
            <input
              v-model="invite.title"
              class="text-field"
              maxlength="80"
              :placeholder="t('projects.team.titlePlaceholder')"
            />
            <AppButton
              type="submit"
              variant="primary"
              :loading="busy === 'invite'"
              :disabled="!invite.login.trim() || archived"
              >{{ t('projects.invites.send') }}</AppButton
            >
          </form>
          <p v-if="invites.length === 0" class="hint">{{ t('projects.invites.none') }}</p>
          <ul v-else class="member-rows">
            <li v-for="item in invites" :key="item.id" class="member-row">
              <span class="person person--wide">
                <strong>@{{ item.inviteeLogin }}</strong>
                <small>{{
                  t('projects.invites.pendingUntil', {
                    role: roleLabel(item.role),
                    date: d(item.expiresAt, { dateStyle: 'medium' }),
                  })
                }}</small>
              </span>
              <ConfirmButton
                :label="t('projects.invites.revoke')"
                :confirm-label="t('projects.team.confirm')"
                :loading="busy === `revoke:${item.id}`"
                @confirm="settings.revokeInvite(item.id)"
              />
            </li>
          </ul>
        </section>
      </div>

      <div v-else-if="tab === 'danger' && hasRole(role, 'owner')" class="danger">
        <section class="card">
          <h2>{{ t('projects.danger.transferHeading') }}</h2>
          <p class="hint">{{ t('projects.danger.transferHint') }}</p>
          <form class="invite-form" @submit.prevent="settings.transfer">
            <AppSelect
              v-model="transferLogin"
              :options="transferCandidates"
              :label="t('projects.danger.newOwner')"
              :placeholder="t('projects.danger.newOwner')"
            />
            <ConfirmButton
              size="md"
              :label="t('projects.danger.transfer')"
              :confirm-label="t('projects.team.confirm')"
              :disabled="!transferLogin"
              :loading="busy === 'transfer'"
              @confirm="settings.transfer"
            />
          </form>
        </section>
        <section class="card card--danger">
          <h2>{{ t('projects.danger.deleteHeading') }}</h2>
          <p class="hint">{{ t('projects.danger.deleteHint', { slug: project.slug }) }}</p>
          <form class="invite-form" @submit.prevent="settings.remove">
            <input
              v-model="deleteConfirm"
              class="text-field mono"
              :placeholder="project.slug"
              :aria-label="t('projects.danger.deleteConfirm')"
            />
            <AppButton
              type="submit"
              variant="danger"
              :disabled="deleteConfirm !== project.slug"
              :loading="busy === 'delete'"
              >{{ t('projects.danger.delete') }}</AppButton
            >
          </form>
        </section>
      </div>
    </section>
  </LoadState>
</template>

<style scoped>
.back {
  display: inline-flex;
  margin-bottom: var(--space-6);
}
.settings {
  display: grid;
  gap: var(--space-4);
  max-width: 1100px;
}
.head h1 {
  font-size: var(--text-title);
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}
.card--danger {
  border-color: var(--danger);
}
.form,
.readme,
.members,
.danger {
  display: grid;
  gap: var(--space-4);
}
.form {
  max-width: 720px;
}
label {
  display: grid;
  gap: var(--space-2);
}
label > span,
.hint,
.person small,
.counter {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.counter--over,
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
.warning {
  color: var(--warning);
  font-size: var(--text-caption);
}
.saved {
  color: var(--success);
  font-size: var(--text-caption);
}
textarea.text-field {
  height: auto;
  padding-block: var(--space-3);
  resize: vertical;
}
.text-field.mono {
  font-family: var(--font-mono);
}
h2 {
  margin-bottom: var(--space-4);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
.link-rows,
.member-rows {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}
/* Колонки задаёт список, строки берут их через subgrid — иначе у каждой
   строки свой auto-столбец под кнопку и поля разъезжаются. */
.member-rows {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 170px auto;
  column-gap: var(--space-3);
}
.link-row {
  display: grid;
  grid-template-columns: 170px minmax(0, 2fr) minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
}
.row-actions,
.actions {
  display: flex;
  gap: var(--space-1);
}
.actions {
  justify-content: space-between;
}
.member-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}
.member-row > button:last-child {
  grid-column: -2;
  justify-self: end;
}
.person--wide {
  grid-column: 1 / -2;
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
.chip--muted {
  justify-self: start;
  background: var(--card);
  color: var(--text-muted);
}
.invite-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.invite-form > * {
  flex: 1 1 160px;
}
.invite-form > button {
  flex: 0 0 auto;
}
@media (max-width: 800px) {
  .link-row,
  .member-rows,
  .member-row {
    grid-template-columns: minmax(0, 1fr);
  }
  .member-row > *,
  .member-row > button:last-child,
  .person--wide {
    grid-column: auto;
  }
  .member-row > button:last-child {
    justify-self: start;
  }
  .card {
    padding: var(--space-4);
  }
}
</style>

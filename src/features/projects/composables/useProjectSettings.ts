import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  deleteProject,
  getProject,
  inviteToProject,
  listProjectInvites,
  removeProjectMember,
  replaceProjectLinks,
  revokeProjectInvite,
  transferProject,
  updateProject,
  updateProjectMember,
} from '@/api/projects'
import type { ProjectChanges, ProjectLinkDraft } from '@/api/projects'
import type {
  Project,
  ProjectInvite,
  ProjectLinkKind,
  ProjectRole,
  ProjectVisibility,
} from '@/api/schemas/projects'
import { translate } from '@/i18n'
import { runBusyAction } from '@/lib/asyncAction'
import { errorText } from '@/lib/errors'
import { blankToNull } from '@/lib/forms'
import {
  MAX_PROJECT_LINKS,
  README_MAX_LENGTH,
  canManageProject,
  isHttpUrl,
  isOwner,
  moved,
} from '@/lib/projects'

export type SettingsTab = 'main' | 'readme' | 'links' | 'members' | 'danger'

export interface LinkRow {
  key: number
  kind: ProjectLinkKind
  url: string
  label: string
}

export interface MainForm {
  title: string
  slug: string
  summary: string
  visibility: ProjectVisibility
  logoAssetId: string | null
  logoUrl: string | null
}

/** Вкладки по роли: недоступное не показываем вовсе (§4.3 спецификации). */
export function settingsTabs(role: ProjectRole | null): SettingsTab[] {
  const tabs: SettingsTab[] = ['main', 'readme', 'links', 'members']
  return isOwner(role) ? [...tabs, 'danger'] : tabs
}

/** Изменённые поля «Основного»: contributor не должен слать title/slug/visibility. */
export function mainChanges(project: Project, form: MainForm): ProjectChanges {
  const changes: ProjectChanges = {}
  if (canManageProject(project.myRole)) {
    if (form.title.trim() !== project.title) changes.title = form.title.trim()
    if (form.slug !== project.slug) changes.slug = form.slug
    if (form.visibility !== project.visibility) changes.visibility = form.visibility
  }
  const summary = blankToNull(form.summary)
  if (summary !== project.summary) changes.summary = summary
  if (form.logoAssetId !== project.logoAssetId) changes.logoAssetId = form.logoAssetId
  return changes
}

export function linkErrors(rows: LinkRow[]): string | null {
  if (rows.length > MAX_PROJECT_LINKS) {
    return translate('projects.settings.linksTooMany', { max: MAX_PROJECT_LINKS })
  }
  const broken = rows.find((row) => !isHttpUrl(row.url))
  return broken ? translate('projects.settings.linkInvalid', { url: broken.url || '—' }) : null
}

export function useProjectSettings(slug: () => string) {
  const router = useRouter()
  const project = ref<Project | null>(null)
  const invites = ref<ProjectInvite[]>([])
  const pending = ref(true)
  const loadError = ref<unknown>(null)
  const busy = ref<string | null>(null)
  const error = ref<string | null>(null)
  const saved = ref<string | null>(null)

  const main = ref<MainForm>({
    title: '',
    slug: '',
    summary: '',
    visibility: 'private',
    logoAssetId: null,
    logoUrl: null,
  })
  const readme = ref('')
  const links = ref<LinkRow[]>([])
  const invite = ref<{ login: string; role: ProjectRole; title: string }>({
    login: '',
    role: 'contributor',
    title: '',
  })
  const deleteConfirm = ref('')
  const transferLogin = ref('')
  let linkKey = 0

  const role = computed(() => project.value?.myRole ?? null)
  const tabs = computed(() => settingsTabs(role.value))
  const archived = computed(() => project.value?.status === 'archived')
  const readmeTooLong = computed(() => readme.value.length > README_MAX_LENGTH)
  const linksError = computed(() => linkErrors(links.value))

  function fill(value: Project): void {
    project.value = value
    main.value = {
      title: value.title,
      slug: value.slug,
      summary: value.summary ?? '',
      visibility: value.visibility,
      logoAssetId: value.logoAssetId,
      logoUrl: value.logoUrl,
    }
    readme.value = value.readmeMd
    links.value = value.links.map((link) => ({
      key: ++linkKey,
      kind: link.kind,
      url: link.url,
      label: link.label ?? '',
    }))
  }

  async function loadInvites(): Promise<void> {
    invites.value = canManageProject(role.value) ? await listProjectInvites(slug()) : []
  }

  async function load(): Promise<void> {
    pending.value = true
    loadError.value = null
    try {
      fill(await getProject(slug()))
      await loadInvites()
    } catch (cause) {
      loadError.value = cause
    } finally {
      pending.value = false
    }
  }

  async function run(name: string, action: () => Promise<unknown>, done?: string): Promise<void> {
    saved.value = null
    await runBusyAction(
      {
        setBusy: (active) => (busy.value = active ? name : null),
        clearError: () => (error.value = null),
        setError: (cause) => (error.value = errorText(cause)),
      },
      async () => {
        await action()
        if (done) saved.value = done
      },
    )
  }

  function saveMain(): Promise<void> {
    return run(
      'main',
      async () => {
        if (!project.value) return
        const before = project.value.slug
        const updated = await updateProject(before, mainChanges(project.value, main.value))
        fill(updated)
        if (updated.slug !== before) {
          await router.replace({ name: 'project-settings', params: { slug: updated.slug } })
        }
      },
      translate('projects.settings.saved'),
    )
  }

  function saveReadme(): Promise<void> {
    return run(
      'readme',
      async () => {
        fill(await updateProject(slug(), { readmeMd: readme.value }))
      },
      translate('projects.settings.readmeSaved'),
    )
  }

  function addLink(): void {
    links.value = [...links.value, { key: ++linkKey, kind: 'repository', url: '', label: '' }]
  }

  function removeLink(index: number): void {
    links.value = links.value.filter((_, position) => position !== index)
  }

  function moveLink(index: number, offset: number): void {
    links.value = moved(links.value, index, index + offset)
  }

  function saveLinks(): Promise<void> {
    const drafts: ProjectLinkDraft[] = links.value.map((row) => ({
      kind: row.kind,
      url: row.url.trim(),
      label: blankToNull(row.label),
    }))
    return run(
      'links',
      async () => {
        fill(await replaceProjectLinks(slug(), drafts))
      },
      translate('projects.settings.linksSaved'),
    )
  }

  function changeMember(login: string, changes: { role?: ProjectRole; title?: string | null }) {
    return run(`member:${login}`, async () => {
      const members = await updateProjectMember(slug(), login, changes)
      if (project.value) project.value = { ...project.value, members }
    })
  }

  function removeMember(login: string): Promise<void> {
    return run(`remove:${login}`, async () => {
      await removeProjectMember(slug(), login)
      fill(await getProject(slug()))
    })
  }

  function sendInvite(): Promise<void> {
    return run(
      'invite',
      async () => {
        await inviteToProject(slug(), {
          login: invite.value.login.trim(),
          role: invite.value.role,
          title: blankToNull(invite.value.title),
        })
        invite.value = { ...invite.value, login: '', title: '' }
        await loadInvites()
      },
      translate('projects.settings.inviteSent'),
    )
  }

  function revokeInvite(inviteId: string): Promise<void> {
    return run(`revoke:${inviteId}`, async () => {
      await revokeProjectInvite(slug(), inviteId)
      await loadInvites()
    })
  }

  function transfer(): Promise<void> {
    return run(
      'transfer',
      async () => {
        fill(await transferProject(slug(), transferLogin.value))
        transferLogin.value = ''
        await loadInvites()
      },
      translate('projects.settings.transferred'),
    )
  }

  function remove(): Promise<void> {
    return run('delete', async () => {
      if (deleteConfirm.value !== slug()) return
      await deleteProject(slug())
      await router.push({ name: 'projects', query: { tab: 'mine' } })
    })
  }

  return {
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
    load,
    saveMain,
    saveReadme,
    addLink,
    removeLink,
    moveLink,
    saveLinks,
    changeMember,
    removeMember,
    sendInvite,
    revokeInvite,
    transfer,
    remove,
  }
}

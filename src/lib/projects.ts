import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import type { ProjectCatalogQuery } from '@/api/projects'
import {
  projectLinkKindSchema,
  projectSortSchema,
  projectStatusSchema,
} from '@/api/schemas/projects'
import type {
  ProfileBlock,
  ProjectLinkKind,
  ProjectRole,
  ProjectSort,
  ProjectStatus,
  ProjectVisibility,
} from '@/api/schemas/projects'
import { translate } from '@/i18n'

export const README_MAX_LENGTH = 100_000
export const MAX_PROJECT_LINKS = 20

export const PROJECT_STATUSES: ProjectStatus[] = [
  'idea',
  'planning',
  'in_progress',
  'paused',
  'done',
  'archived',
]
export const PROJECT_VISIBILITIES: ProjectVisibility[] = ['public', 'authenticated', 'private']
export const PROJECT_ROLES: ProjectRole[] = ['owner', 'maintainer', 'contributor', 'viewer']
export const PROJECT_LINK_KINDS: ProjectLinkKind[] = [
  'repository',
  'demo',
  'docs',
  'design',
  'video',
  'presentation',
  'other',
]
export const PROJECT_SORTS: ProjectSort[] = ['updated', 'created', 'status_changed', 'title']
export const PROFILE_BLOCKS: ProfileBlock[] = ['about', 'projects', 'stats', 'courses', 'resume']

/** `other` в словаре занят формами множественного числа — у ссылок это `misc`. */
const linkKey = (value: ProjectLinkKind): Exclude<ProjectLinkKind, 'other'> | 'misc' =>
  value === 'other' ? 'misc' : value

export const statusLabel = (value: ProjectStatus): string => translate(`projects.status.${value}`)
export const visibilityLabel = (value: ProjectVisibility): string =>
  translate(`projects.visibility.${value}`)
export const visibilityHint = (value: ProjectVisibility): string =>
  translate(`projects.visibilityHint.${value}`)
export const roleLabel = (value: ProjectRole): string => translate(`projects.role.${value}`)
export const linkKindLabel = (value: ProjectLinkKind): string =>
  translate(`projects.linkKind.${linkKey(value)}`)
export const linkKindFilterLabel = (value: ProjectLinkKind): string =>
  translate(`projects.linkFilter.${linkKey(value)}`)
export const sortLabel = (value: ProjectSort): string => translate(`projects.sort.${value}`)
export const profileBlockLabel = (value: ProfileBlock): string =>
  translate(`profileBlocks.${value}`)

const ROLE_RANK: Record<ProjectRole, number> = {
  viewer: 0,
  contributor: 1,
  maintainer: 2,
  owner: 3,
}

/** Зеркало матрицы прав бэкенда — только чтобы прятать недоступное; проверяет сервер. */
export function hasRole(role: ProjectRole | null | undefined, minimum: ProjectRole): boolean {
  return role != null && ROLE_RANK[role] >= ROLE_RANK[minimum]
}

export const canEditContent = (role: ProjectRole | null | undefined): boolean =>
  hasRole(role, 'contributor')
export const canManageProject = (role: ProjectRole | null | undefined): boolean =>
  hasRole(role, 'maintainer')
export const isOwner = (role: ProjectRole | null | undefined): boolean => hasRole(role, 'owner')

/** Роли, на которые можно пригласить или исключить: строго ниже своей. */
export function rolesBelow(role: ProjectRole | null | undefined): ProjectRole[] {
  if (role == null) return []
  return PROJECT_ROLES.filter((value) => ROLE_RANK[value] < ROLE_RANK[role])
}

export function repositoryHost(url: string): 'github' | 'gitlab' | 'other' {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host === 'github.com' || host.endsWith('.github.com')) return 'github'
    if (host === 'gitlab.com' || host.endsWith('.gitlab.com')) return 'gitlab'
  } catch {
    // Невалидный URL сервер не пропустит; на всякий случай — общая иконка.
  }
  return 'other'
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host !== ''
  } catch {
    return false
  }
}

export const DEFAULT_CATALOG_QUERY: ProjectCatalogQuery = {
  q: '',
  statuses: [],
  linkKinds: [],
  member: '',
  sort: 'updated',
}

function many(value: LocationQuery[string] | undefined): string[] {
  const list = Array.isArray(value) ? value : value == null ? [] : [value]
  return list.filter((item): item is string => typeof item === 'string')
}

function one(value: LocationQuery[string] | undefined): string {
  return many(value)[0] ?? ''
}

/** Состояние фильтров живёт в URL: ссылку на выборку можно отправить, «назад» работает. */
export function catalogQueryFromRoute(query: LocationQuery): ProjectCatalogQuery {
  const sort = projectSortSchema.safeParse(one(query.sort))
  return {
    q: one(query.q),
    statuses: many(query.status).flatMap((item) => {
      const parsed = projectStatusSchema.safeParse(item)
      return parsed.success ? [parsed.data] : []
    }),
    linkKinds: many(query.link).flatMap((item) => {
      const parsed = projectLinkKindSchema.safeParse(item)
      return parsed.success ? [parsed.data] : []
    }),
    member: one(query.member),
    sort: sort.success ? sort.data : DEFAULT_CATALOG_QUERY.sort,
  }
}

export function catalogQueryToRoute(query: ProjectCatalogQuery): LocationQueryRaw {
  return {
    ...(query.q.trim() ? { q: query.q.trim() } : {}),
    ...(query.statuses.length ? { status: [...query.statuses] } : {}),
    ...(query.linkKinds.length ? { link: [...query.linkKinds] } : {}),
    ...(query.member ? { member: query.member } : {}),
    ...(query.sort !== DEFAULT_CATALOG_QUERY.sort ? { sort: query.sort } : {}),
  }
}

export function isCatalogFiltered(query: ProjectCatalogQuery): boolean {
  return (
    query.q.trim() !== '' ||
    query.statuses.length > 0 ||
    query.linkKinds.length > 0 ||
    query.member !== ''
  )
}

export function toggled<T>(items: readonly T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value]
}

export function moved<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items]
  }
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item as T)
  return next
}

import { snakeBody } from './case'
import { request } from './client'
import {
  profileLayoutSchema,
  projectCardListSchema,
  projectCardPageSchema,
  projectCardSchema,
  projectInviteListSchema,
  projectInviteSchema,
  projectMemberListSchema,
  projectSchema,
  projectStatusEventListSchema,
} from './schemas/projects'
import type {
  ProfileLayoutItem,
  Project,
  ProjectCard,
  ProjectCardPage,
  ProjectInvite,
  ProjectLinkKind,
  ProjectMember,
  ProjectRole,
  ProjectSort,
  ProjectStatus,
  ProjectStatusEvent,
  ProjectVisibility,
} from './schemas/projects'

export const PROJECT_PAGE_SIZE = 24

export interface ProjectCatalogQuery {
  q: string
  statuses: ProjectStatus[]
  linkKinds: ProjectLinkKind[]
  member: string
  sort: ProjectSort
}

export interface ProjectChanges {
  title?: string
  slug?: string
  summary?: string | null
  readmeMd?: string
  visibility?: ProjectVisibility
  logoAssetId?: string | null
}

export interface ProjectLinkDraft {
  kind: ProjectLinkKind
  url: string
  label: string | null
}

export interface ProjectMemberChanges {
  role?: ProjectRole
  title?: string | null
}

const path = (slug: string): string => `/projects/${encodeURIComponent(slug)}`

export function listProjects(
  query: ProjectCatalogQuery,
  offset = 0,
  limit = PROJECT_PAGE_SIZE,
): Promise<ProjectCardPage> {
  return request('/projects', {
    schema: projectCardPageSchema,
    query: {
      q: query.q.trim() || undefined,
      status: query.statuses,
      link_kind: query.linkKinds,
      member: query.member || undefined,
      sort: query.sort,
      limit,
      offset,
    },
  })
}

export function listMyProjects(): Promise<ProjectCard[]> {
  return request('/me/projects', { schema: projectCardListSchema })
}

export function createProject(draft: {
  title: string
  summary?: string | null
  visibility?: ProjectVisibility
}): Promise<Project> {
  return request('/projects', {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: projectSchema,
  })
}

export function getProject(slug: string): Promise<Project> {
  return request(path(slug), { schema: projectSchema })
}

export function updateProject(slug: string, changes: ProjectChanges): Promise<Project> {
  return request(path(slug), {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: projectSchema,
  })
}

export function changeProjectStatus(slug: string, status: ProjectStatus): Promise<Project> {
  return request(`${path(slug)}/status`, {
    method: 'POST',
    body: { status },
    schema: projectSchema,
  })
}

export function listStatusEvents(slug: string): Promise<ProjectStatusEvent[]> {
  return request(`${path(slug)}/status-events`, { schema: projectStatusEventListSchema })
}

export async function deleteProject(slug: string): Promise<void> {
  await request(path(slug), { method: 'DELETE' })
}

export function replaceProjectLinks(slug: string, links: ProjectLinkDraft[]): Promise<Project> {
  return request(`${path(slug)}/links`, {
    method: 'PUT',
    body: { links: links.map((link) => snakeBody({ ...link })) },
    schema: projectSchema,
  })
}

export function updateProjectMember(
  slug: string,
  login: string,
  changes: ProjectMemberChanges,
): Promise<ProjectMember[]> {
  return request(`${path(slug)}/members/${encodeURIComponent(login)}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: projectMemberListSchema,
  })
}

export async function removeProjectMember(slug: string, login: string): Promise<void> {
  await request(`${path(slug)}/members/${encodeURIComponent(login)}`, { method: 'DELETE' })
}

export function transferProject(slug: string, login: string): Promise<Project> {
  return request(`${path(slug)}/transfer`, {
    method: 'POST',
    body: { login },
    schema: projectSchema,
  })
}

export function listProjectInvites(slug: string): Promise<ProjectInvite[]> {
  return request(`${path(slug)}/invites`, { schema: projectInviteListSchema })
}

export function inviteToProject(
  slug: string,
  invite: { login: string; role: ProjectRole; title: string | null },
): Promise<ProjectInvite> {
  return request(`${path(slug)}/invites`, {
    method: 'POST',
    body: snakeBody({ ...invite }),
    schema: projectInviteSchema,
  })
}

export async function revokeProjectInvite(slug: string, inviteId: string): Promise<void> {
  await request(`${path(slug)}/invites/${inviteId}`, { method: 'DELETE' })
}

export function listMyInvites(): Promise<ProjectInvite[]> {
  return request('/me/invites', { schema: projectInviteListSchema })
}

export function acceptInvite(inviteId: string): Promise<ProjectCard> {
  return request(`/me/invites/${inviteId}/accept`, { method: 'POST', schema: projectCardSchema })
}

export async function declineInvite(inviteId: string): Promise<void> {
  await request(`/me/invites/${inviteId}/decline`, { method: 'POST' })
}

export async function saveMyProjectsOrder(
  items: { projectId: string; showInProfile: boolean }[],
): Promise<void> {
  await request('/me/projects/order', {
    method: 'PUT',
    body: { items: items.map((item) => snakeBody({ ...item })) },
  })
}

export async function getProfileLayout(): Promise<ProfileLayoutItem[]> {
  return (await request('/me/profile-layout', { schema: profileLayoutSchema })).blocks
}

export async function saveProfileLayout(blocks: ProfileLayoutItem[]): Promise<ProfileLayoutItem[]> {
  return (
    await request('/me/profile-layout', {
      method: 'PUT',
      body: { blocks },
      schema: profileLayoutSchema,
    })
  ).blocks
}

import { describe, expect, it } from 'vitest'

import type { Project, ProjectCard } from '@/api/schemas/projects'

import { filterMyProjects } from '../useMyProjects'
import { linkErrors, mainChanges, settingsTabs } from '../useProjectSettings'

const project = {
  title: 'Трамплин',
  slug: 'tramplin',
  summary: null,
  visibility: 'private',
  logoAssetId: null,
  myRole: 'contributor',
} as unknown as Project

const form = {
  title: 'Новое',
  slug: 'new',
  summary: ' Кратко ',
  visibility: 'public' as const,
  logoAssetId: null,
  logoUrl: null,
}

describe('project settings', () => {
  it('прячут опасную зону от всех, кроме владельца', () => {
    expect(settingsTabs('maintainer')).not.toContain('danger')
    expect(settingsTabs('owner')).toContain('danger')
  })

  it('не шлют участнику поля, которые ему нельзя менять', () => {
    expect(mainChanges(project, form)).toEqual({ summary: 'Кратко' })
    expect(mainChanges({ ...project, myRole: 'maintainer' }, form)).toEqual({
      title: 'Новое',
      slug: 'new',
      visibility: 'public',
      summary: 'Кратко',
    })
  })

  it('проверяют ссылки до отправки', () => {
    const row = { key: 1, kind: 'demo' as const, url: 'https://x.dev', label: '' }
    expect(linkErrors([row])).toBeNull()
    expect(linkErrors([{ ...row, url: 'ftp://x' }])).toContain('ftp://x')
    expect(linkErrors(Array.from({ length: 21 }, () => row))).not.toBeNull()
  })
})

describe('filterMyProjects', () => {
  const items = [
    { title: 'Бот', summary: null, status: 'done', myRole: 'owner' },
    { title: 'Сайт', summary: 'про бота', status: 'idea', myRole: 'viewer' },
  ] as unknown as ProjectCard[]

  it('фильтрует по тексту, статусу и роли', () => {
    expect(filterMyProjects(items, { q: 'бот', statuses: [], role: '' })).toHaveLength(2)
    expect(filterMyProjects(items, { q: 'бот', statuses: ['idea'], role: '' })).toHaveLength(1)
    expect(filterMyProjects(items, { q: '', statuses: [], role: 'owner' })[0]?.title).toBe('Бот')
  })
})

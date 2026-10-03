import { describe, expect, it } from 'vitest'

import type { PublicProfile } from '@/api/schemas/users'
import { profileBlocksToRender } from '@/lib/profileLayout'
import {
  DEFAULT_CATALOG_QUERY,
  canEditContent,
  canManageProject,
  catalogQueryFromRoute,
  catalogQueryToRoute,
  isCatalogFiltered,
  isHttpUrl,
  moved,
  repositoryHost,
  rolesBelow,
  toggled,
} from '@/lib/projects'

describe('catalog query ↔ URL', () => {
  it('переживает круг через query-строку', () => {
    const query = {
      q: 'бот',
      statuses: ['in_progress', 'done'] as const,
      linkKinds: ['repository'] as const,
      member: 'anya',
      sort: 'title' as const,
    }
    const route = catalogQueryToRoute({
      ...query,
      statuses: [...query.statuses],
      linkKinds: [...query.linkKinds],
    })

    expect(route).toEqual({
      q: 'бот',
      status: ['in_progress', 'done'],
      link: ['repository'],
      member: 'anya',
      sort: 'title',
    })
    expect(catalogQueryFromRoute(route as never)).toEqual({
      ...query,
      statuses: ['in_progress', 'done'],
      linkKinds: ['repository'],
    })
  })

  it('выбрасывает мусор и умолчания из URL', () => {
    expect(
      catalogQueryFromRoute({ status: ['nope', 'idea'], sort: 'random', link: 'demo' }),
    ).toEqual({
      ...DEFAULT_CATALOG_QUERY,
      statuses: ['idea'],
      linkKinds: ['demo'],
    })
    expect(catalogQueryToRoute(DEFAULT_CATALOG_QUERY)).toEqual({})
    expect(isCatalogFiltered(DEFAULT_CATALOG_QUERY)).toBe(false)
    expect(isCatalogFiltered({ ...DEFAULT_CATALOG_QUERY, statuses: ['done'] })).toBe(true)
  })
})

describe('project permissions', () => {
  it('повторяют матрицу ролей бэкенда', () => {
    expect(canEditContent('contributor')).toBe(true)
    expect(canEditContent('viewer')).toBe(false)
    expect(canManageProject('contributor')).toBe(false)
    expect(canManageProject('maintainer')).toBe(true)
    expect(canManageProject(null)).toBe(false)
    expect(rolesBelow('maintainer')).toEqual(['contributor', 'viewer'])
    expect(rolesBelow('viewer')).toEqual([])
  })
})

describe('project helpers', () => {
  it('узнают хост репозитория и проверяют схему ссылки', () => {
    expect(repositoryHost('https://github.com/a/b')).toBe('github')
    expect(repositoryHost('https://gitlab.com/a/b')).toBe('gitlab')
    expect(repositoryHost('https://git.example.com/a')).toBe('other')
    expect(repositoryHost('не ссылка')).toBe('other')
    expect(isHttpUrl('https://demo.dev')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('переставляют и переключают элементы', () => {
    expect(moved(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moved(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
    expect(toggled(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggled(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('profileBlocksToRender', () => {
  const profile = {
    bio: 'Пишу бэкенд',
    interests: [],
    projects: [],
    completedLessons: 3,
    activeCourses: [],
    resumeUrl: null,
    layout: ['projects', 'stats', 'about', 'resume'],
  } as unknown as PublicProfile

  it('рисует блоки в порядке layout и пропускает пустые', () => {
    expect(profileBlocksToRender(profile)).toEqual(['stats', 'about'])
  })

  it('не рисует скрытые блоки, даже если данные есть', () => {
    expect(profileBlocksToRender({ ...profile, layout: ['about'] })).toEqual(['about'])
  })
})

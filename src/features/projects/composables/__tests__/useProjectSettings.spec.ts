import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getProject,
  listProjectInvites,
  removeProjectMember,
  replaceProjectLinks,
} from '@/api/projects'
import type { Project } from '@/api/schemas/projects'

import { useProjectSettings } from '../useProjectSettings'

const push = vi.fn()

vi.mock('vue-router', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }))
vi.mock('@/api/projects', () => ({
  deleteProject: vi.fn(),
  getProject: vi.fn(),
  inviteToProject: vi.fn(),
  listProjectInvites: vi.fn(),
  removeProjectMember: vi.fn(),
  replaceProjectLinks: vi.fn(),
  revokeProjectInvite: vi.fn(),
  transferProject: vi.fn(),
  updateProject: vi.fn(),
  updateProjectMember: vi.fn(),
}))

/** Только поля, которые читают формы настроек. */
function project(changes: Partial<Project> = {}): Project {
  return {
    title: 'StudyFlow',
    slug: 'studyflow',
    summary: null,
    visibility: 'private',
    logoAssetId: null,
    logoUrl: null,
    readmeMd: '# StudyFlow',
    links: [],
    members: [],
    status: 'in_progress',
    myRole: 'maintainer',
    ...changes,
  } as unknown as Project
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getProject).mockResolvedValue(project())
  vi.mocked(listProjectInvites).mockResolvedValue([])
})

describe('useProjectSettings', () => {
  it('сохранение ссылок не затирает несохранённый README', async () => {
    const settings = useProjectSettings(() => 'studyflow')
    await settings.load()
    settings.readme.value = '# Черновик, ещё не сохранён'
    settings.main.value = { ...settings.main.value, title: 'Новое название' }

    vi.mocked(replaceProjectLinks).mockResolvedValue(
      project({
        links: [
          {
            id: '01910000-0000-7000-8000-0000000000aa',
            kind: 'demo',
            url: 'https://demo.test',
            label: null,
            position: 0,
          },
        ],
      }),
    )
    settings.addLink()
    await settings.saveLinks()

    expect(settings.links.value.map((row) => row.url)).toEqual(['https://demo.test'])
    expect(settings.readme.value).toBe('# Черновик, ещё не сохранён')
    expect(settings.main.value.title).toBe('Новое название')
  })

  it('исключение участника не затирает несохранённые формы', async () => {
    const settings = useProjectSettings(() => 'studyflow')
    await settings.load()
    settings.readme.value = '# Черновик'

    await settings.removeMember('i.petrov')

    expect(removeProjectMember).toHaveBeenCalledWith('studyflow', 'i.petrov')
    expect(settings.readme.value).toBe('# Черновик')
  })

  it('выход из проекта уводит со страницы его настроек', async () => {
    const settings = useProjectSettings(() => 'studyflow')
    await settings.load()
    vi.mocked(getProject).mockClear()

    await settings.removeMember('a.morozov', { leaving: true })

    expect(push).toHaveBeenCalledWith({ name: 'projects', query: { tab: 'mine' } })
    expect(getProject).not.toHaveBeenCalled()
  })
})

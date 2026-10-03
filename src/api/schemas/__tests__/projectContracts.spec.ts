import { describe, expect, it } from 'vitest'

import { camelizeKeys } from '@/api/case'
import { profileLayoutSchema, projectSchema } from '@/api/schemas/projects'
import { publicProfileSchema } from '@/api/schemas/users'

const card = {
  id: '01910000-0000-7000-8000-000000000001',
  slug: 'tramplin',
  title: 'Трамплин',
  summary: null,
  status: 'in_progress',
  visibility: 'public',
  logo_url: null,
  members_count: 2,
  my_role: null,
  member_title: 'Бэкенд',
  show_in_profile: null,
  updated_at: '2026-10-03T10:00:00+00:00',
}

describe('project contracts', () => {
  it('разбирают полную карточку проекта', () => {
    const project = projectSchema.parse(
      camelizeKeys({
        ...card,
        readme_md: '# README',
        logo_asset_id: null,
        links: [
          {
            id: '01910000-0000-7000-8000-000000000002',
            kind: 'repository',
            url: 'https://gitlab.com/a/b',
            label: null,
            position: 0,
          },
        ],
        members: [
          {
            user_id: '01910000-0000-7000-8000-000000000003',
            login: 'anya',
            name: null,
            avatar_url: null,
            role: 'owner',
            title: null,
            joined_at: '2026-10-03T10:00:00+00:00',
          },
        ],
        status_changed_at: '2026-10-03T10:00:00+00:00',
        created_at: '2026-10-03T10:00:00+00:00',
      }),
    )

    expect(project.links[0]?.kind).toBe('repository')
    expect(project.members[0]?.role).toBe('owner')
  })

  it('отвергают неизвестный статус и блок раскладки', () => {
    expect(projectSchema.safeParse(camelizeKeys({ ...card, status: 'frozen' })).success).toBe(false)
    expect(
      profileLayoutSchema.safeParse({ blocks: [{ block: 'secret', visible: true }] }).success,
    ).toBe(false)
  })

  it('принимают профиль со скрытой статистикой и проектами', () => {
    const profile = publicProfileSchema.parse(
      camelizeKeys({
        id: '01910000-0000-7000-8000-000000000004',
        login: 'anya',
        name: null,
        avatar_url: null,
        headline: null,
        specialty: null,
        grade: null,
        experience_years: null,
        company: null,
        university: null,
        interests: [],
        bio: null,
        completed_lessons: null,
        passed_quizzes: null,
        solved_algorithms: null,
        active_courses: [],
        resume_url: null,
        layout: ['projects'],
        projects: [card],
      }),
    )

    expect(profile.completedLessons).toBeNull()
    expect(profile.projects[0]?.memberTitle).toBe('Бэкенд')
  })
})

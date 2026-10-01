import type { RouteLocationRaw } from 'vue-router'

export type SectionAccess = 'everyone' | 'teacher' | 'admin'
export type SectionKey =
  | 'news'
  | 'learning'
  | 'catalog'
  | 'algorithms'
  | 'people'
  | 'content'
  | 'news-desk'
  | 'algorithm-library'
  | 'users'

export type SectionGroup = 'learning' | 'teaching' | 'system'

/** Ключ раздела в словаре `sections.*`: там лежат его название и краткое описание. */
export type SectionMessages =
  | 'news'
  | 'learning'
  | 'catalog'
  | 'algorithms'
  | 'people'
  | 'content'
  | 'newsDesk'
  | 'algorithmLibrary'
  | 'users'

export interface Section {
  key: SectionKey
  messages: SectionMessages
  to: RouteLocationRaw
  access: SectionAccess
  group: SectionGroup
}

export const SECTIONS: Section[] = [
  {
    key: 'news',
    messages: 'news',
    to: { name: 'home' },
    access: 'everyone',
    group: 'learning',
  },
  {
    key: 'learning',
    messages: 'learning',
    to: { name: 'learning' },
    access: 'everyone',
    group: 'learning',
  },
  {
    key: 'catalog',
    messages: 'catalog',
    to: { name: 'catalog' },
    access: 'everyone',
    group: 'learning',
  },
  {
    key: 'algorithms',
    messages: 'algorithms',
    to: { name: 'algorithms' },
    access: 'everyone',
    group: 'learning',
  },
  {
    key: 'people',
    messages: 'people',
    to: { name: 'people' },
    access: 'everyone',
    group: 'learning',
  },
  {
    key: 'content',
    messages: 'content',
    to: { name: 'manage-content' },
    access: 'teacher',
    group: 'teaching',
  },
  {
    key: 'news-desk',
    messages: 'newsDesk',
    to: { name: 'manage-news' },
    access: 'teacher',
    group: 'teaching',
  },
  {
    key: 'algorithm-library',
    messages: 'algorithmLibrary',
    to: { name: 'manage-algorithms' },
    access: 'teacher',
    group: 'teaching',
  },
  {
    key: 'users',
    messages: 'users',
    to: { name: 'admin-users' },
    access: 'admin',
    group: 'system',
  },
]

export function visibleSections(options: { isTeacher: boolean; isAdmin: boolean }): Section[] {
  return SECTIONS.filter((section) => {
    if (section.access === 'admin') {
      return options.isAdmin
    }
    if (section.access === 'teacher') {
      return options.isTeacher
    }
    return true
  })
}

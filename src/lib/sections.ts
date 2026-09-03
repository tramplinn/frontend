import type { RouteLocationRaw } from 'vue-router'

export type SectionAccess = 'everyone' | 'teacher' | 'admin'
export type SectionKey =
  | 'news'
  | 'learning'
  | 'catalog'
  | 'algorithms'
  | 'content'
  | 'news-desk'
  | 'algorithm-library'
  | 'users'

export interface Section {
  key: SectionKey
  title: string
  summary: string
  to: RouteLocationRaw
  access: SectionAccess
  group: 'обучение' | 'преподавание' | 'система'
}

export const SECTIONS: Section[] = [
  {
    key: 'news',
    title: 'новости',
    summary: 'Что происходит',
    to: { name: 'home' },
    access: 'everyone',
    group: 'обучение',
  },
  {
    key: 'learning',
    title: 'моё обучение',
    summary: 'Что начато и что продолжить',
    to: { name: 'learning' },
    access: 'everyone',
    group: 'обучение',
  },
  {
    key: 'catalog',
    title: 'курсы',
    summary: 'Каталог по трекам',
    to: { name: 'catalog' },
    access: 'everyone',
    group: 'обучение',
  },
  {
    key: 'algorithms',
    title: 'алгосы',
    summary: 'Тренажёр задач вне курсов',
    to: { name: 'algorithms' },
    access: 'everyone',
    group: 'обучение',
  },
  {
    key: 'content',
    title: 'контент',
    summary: 'Треки, курсы, модули и уроки',
    to: { name: 'manage-content' },
    access: 'teacher',
    group: 'преподавание',
  },
  {
    key: 'news-desk',
    title: 'новости',
    summary: 'Лента главной страницы',
    to: { name: 'manage-news' },
    access: 'teacher',
    group: 'преподавание',
  },
  {
    key: 'algorithm-library',
    title: 'алгозадачи',
    summary: 'Условия, тесты и эталонные решения',
    to: { name: 'manage-algorithms' },
    access: 'teacher',
    group: 'преподавание',
  },
  {
    key: 'users',
    title: 'пользователи',
    summary: 'Роли и доступ',
    to: { name: 'admin-users' },
    access: 'admin',
    group: 'система',
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

// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import { router as appRouter } from '@/router'
import { useContentStore } from '@/stores/content'

const cases: [string, string[], string][] = [
  ['/', [], 'главная'],
  ['/sections', ['/'], 'все разделы'],
  ['/learning', ['/'], 'моё обучение'],
  ['/people', ['/'], 'люди'],
  ['/people/a.morozov', ['/', '/people'], 'профиль'],
  ['/me', ['/'], 'профиль'],
  ['/projects', ['/'], 'проекты'],
  ['/projects/new', ['/', '/projects'], 'новый'],
  ['/projects/demo', ['/', '/projects'], 'проект'],
  ['/projects/demo/settings', ['/', '/projects', '/projects/demo'], 'настройки'],
  ['/algorithms', ['/'], 'алгосы'],
  ['/algorithms/problem', ['/', '/algorithms'], 'задача'],
  ['/news/article', ['/'], 'новость'],
  ['/courses', ['/'], 'курсы'],
  ['/courses/demo', ['/', '/courses'], 'demo'],
  ['/courses/demo/module/lessons/lesson', ['/', '/courses', '/courses/demo'], 'lesson'],
  ['/courses/demo/module/quizzes/quiz', ['/', '/courses', '/courses/demo'], 'quiz'],
  ['/courses/demo/module/practice/set', ['/', '/courses', '/courses/demo'], 'set'],
  ['/manage/content', ['/'], 'контент'],
  ['/manage/lessons/lesson', ['/', '/manage/content'], 'урок'],
  ['/manage/quizzes/quiz', ['/', '/manage/content'], 'тест'],
  ['/manage/practice-sets/set', ['/', '/manage/content'], 'практика'],
  ['/manage/algorithms', ['/'], 'алгозадачи'],
  ['/manage/algorithms/problem', ['/', '/manage/algorithms'], 'задача'],
  ['/manage/news', ['/'], 'новости'],
  ['/manage/news/article', ['/', '/manage/news'], 'статья'],
  ['/admin/users', ['/'], 'пользователи'],
  ['/mcp/authorize', ['/'], 'доступ к MCP'],
  ['/unknown', ['/'], 'страница не найдена'],
]

async function setup(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: appRouter.getRoutes().map(({ path, name }) => ({
      path,
      name,
      component: { template: '<div />' },
    })),
  })
  const pinia = createPinia()
  await router.push(path)
  const wrapper = mount(AppHeader, {
    global: {
      plugins: [pinia, router],
      stubs: { SignInButton: true, ThemeToggle: true, LocaleSwitcher: true },
    },
  })
  return { wrapper, router, pinia }
}

describe('AppHeader breadcrumbs', () => {
  it.each(cases)(
    '%s сохраняет ссылки на родителей и одну текущую страницу',
    async (path, links, label) => {
      const { wrapper } = await setup(path)
      const crumbs = wrapper.get('nav')
      expect(crumbs.findAll('a').map((link) => link.attributes('href'))).toEqual(links)
      expect(crumbs.findAll('[aria-current="page"]')).toHaveLength(1)
      expect(crumbs.get('[aria-current="page"]').text()).toBe(label)
      wrapper.unmount()
    },
  )

  it('возвращает из профиля в список людей и обновляет цепочку при переходах', async () => {
    const { wrapper, router } = await setup('/people/a.morozov')
    await router.push('/people/e.sokolova')
    await flushPromises()
    await wrapper.get('nav a[href="/people"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('people')
    expect(wrapper.get('nav [aria-current="page"]').text()).toBe('люди')
    expect(wrapper.find('nav a[href="/people"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('после загрузки курса отмечает текущим только урок, а не модуль', async () => {
    const { wrapper, pinia } = await setup('/courses/demo/module/lessons/lesson')
    const content = useContentStore(pinia)
    content.courses.set('demo', {
      id: 'course',
      title: 'Курс',
      slug: 'demo',
      summary: null,
      color: null,
      estHours: null,
      coverAssetId: null,
      coverUrl: null,
      status: 'published',
      tags: [],
      modules: [
        {
          id: 'module',
          courseId: 'course',
          title: 'Модуль',
          slug: 'module',
          summary: null,
          position: 0,
          status: 'published',
          items: [
            {
              id: 'item',
              position: 0,
              kind: 'lesson',
              lesson: {
                id: 'lesson',
                moduleId: 'module',
                title: 'Урок',
                slug: 'lesson',
                estMinutes: null,
                bodyMd: '',
                bodyHtml: '',
                status: 'published',
              },
            },
          ],
        },
      ],
    })
    await flushPromises()
    const crumbs = wrapper.get('nav')
    expect(crumbs.findAll('[aria-current="page"]')).toHaveLength(1)
    expect(crumbs.get('[aria-current="page"]').text()).toBe('урок')
    await crumbs.get('a[href="/courses/demo"]').trigger('click')
    await flushPromises()
    expect(crumbs.get('[aria-current="page"]').text()).toBe('курс')
    wrapper.unmount()
  })
})

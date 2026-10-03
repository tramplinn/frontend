// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import BackLink from '@/components/ui/BackLink.vue'

const stub = { template: '<div />' }

describe('BackLink', () => {
  it('ведёт по именованному маршруту и показывает подпись', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: stub },
        { path: '/projects/:slug', name: 'project', component: stub },
      ],
    })
    await router.push('/')
    const wrapper = mount(BackLink, {
      props: { to: { name: 'project', params: { slug: 'studyflow' } } },
      slots: { default: 'к проекту' },
      global: { plugins: [router] },
    })
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/projects/studyflow')
    expect(link.text()).toBe('к проекту')
    expect(link.find('svg[aria-hidden="true"]').exists()).toBe(true)
  })
})

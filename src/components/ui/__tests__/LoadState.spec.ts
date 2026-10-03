// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LoadState from '@/components/ui/LoadState.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

function mountState(pending: boolean, error: unknown) {
  return mount(LoadState, {
    props: { pending, error },
    slots: { default: '<p class="content">данные</p>' },
  })
}

describe('LoadState', () => {
  it('пока грузится — статус загрузки без содержимого', () => {
    const wrapper = mountState(true, null)
    expect(wrapper.get('[role="status"]').text()).toBe(t('ui.loading'))
    expect(wrapper.find('.content').exists()).toBe(false)
  })

  it('при ошибке — текст ошибки и кнопка повтора', async () => {
    const wrapper = mountState(false, new Error('boom'))
    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain(t('ui.retry'))
    expect(wrapper.find('.content').exists()).toBe(false)

    await alert.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('без загрузки и ошибки — содержимое слота', () => {
    const wrapper = mountState(false, null)
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('[role="status"], [role="alert"]').exists()).toBe(false)
  })
})

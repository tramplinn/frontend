// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

afterEach(() => {
  vi.useRealTimers()
})

describe('ConfirmButton', () => {
  it('первый клик только взводит подтверждение, второй — подтверждает', async () => {
    const wrapper = mount(ConfirmButton)
    const button = wrapper.get('button')
    expect(button.text()).toBe(t('ui.delete'))

    await button.trigger('click')
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(button.text()).toBe(t('ui.confirmDelete'))
    expect(button.classes()).toContain('btn--danger')

    await button.trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(button.text()).toBe(t('ui.delete'))
  })

  it('берёт свои подписи', async () => {
    const wrapper = mount(ConfirmButton, { props: { label: 'исключить', confirmLabel: 'точно?' } })
    expect(wrapper.text()).toBe('исключить')
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toBe('точно?')
  })

  it('взведённое состояние гаснет само через 4 секунды', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ConfirmButton)
    await wrapper.get('button').trigger('click')
    vi.advanceTimersByTime(4000)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe(t('ui.delete'))

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('заблокированная не взводится', async () => {
    const wrapper = mount(ConfirmButton, { props: { disabled: true } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toBe(t('ui.delete'))
  })
})

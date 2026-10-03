// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppButton from '@/components/ui/AppButton.vue'

describe('AppButton', () => {
  it('по умолчанию — обычная кнопка secondary/md, не submit', () => {
    const button = mount(AppButton, { slots: { default: 'сохранить' } }).get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toEqual(expect.arrayContaining(['btn--secondary', 'btn--md']))
    expect(button.text()).toBe('сохранить')
  })

  it('пробрасывает вариант, размер и type', () => {
    const button = mount(AppButton, {
      props: { variant: 'danger', size: 'sm', type: 'submit' },
    }).get('button')
    expect(button.attributes('type')).toBe('submit')
    expect(button.classes()).toEqual(expect.arrayContaining(['btn--danger', 'btn--sm']))
  })

  it('в загрузке заблокирована, показывает спиннер и aria-busy', () => {
    const button = mount(AppButton, { props: { loading: true } }).get('button')
    expect(button.element.disabled).toBe(true)
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.find('.spinner').exists()).toBe(true)
  })

  it('заблокированная не отдаёт click', async () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('активная отдаёт click', async () => {
    const wrapper = mount(AppButton)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})

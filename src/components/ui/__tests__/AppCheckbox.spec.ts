// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppCheckbox from '@/components/ui/AppCheckbox.vue'

describe('AppCheckbox', () => {
  it('пробрасывает id — по нему к чекбоксу привязана подпись', () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, id: 'agree' } })
    expect(wrapper.get('button').attributes('id')).toBe('agree')
  })

  it('переключается кликом в обе стороны', async () => {
    const wrapper = mount(AppCheckbox, { props: { modelValue: false, id: 'agree' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('button').attributes('aria-checked')).toBe('true')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('заблокированный не переключается', async () => {
    const wrapper = mount(AppCheckbox, {
      props: { modelValue: false, id: 'agree', disabled: true },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

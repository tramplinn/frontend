// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FilterChip from '@/components/ui/FilterChip.vue'

describe('FilterChip', () => {
  it('отражает состояние в aria-pressed', async () => {
    const wrapper = mount(FilterChip, { props: { pressed: false }, slots: { default: 'все' } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    await wrapper.setProps({ pressed: true })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toBe('все')
  })

  it('отдаёт ровно один click на нажатие', async () => {
    const wrapper = mount(FilterChip, { props: { pressed: false } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toEqual([[]])
  })
})

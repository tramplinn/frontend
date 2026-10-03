// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ComboInput from '@/components/ui/ComboInput.vue'

const logins = ['e.sokolova', 'i.petrov', 'v.kuznetsova', 'a.morozov', 'm.antonov']

function mountCombo(modelValue = '', suggestions = logins) {
  return mount(ComboInput, { props: { modelValue, suggestions } })
}

function shown(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[role="option"]').map((option) => option.text())
}

describe('ComboInput', () => {
  it('подсказки появляются только в фокусе', async () => {
    const wrapper = mountCombo()
    expect(shown(wrapper)).toEqual([])
    await wrapper.get('input').trigger('focus')
    expect(shown(wrapper)).toEqual(logins)
    expect(wrapper.get('input').attributes('aria-expanded')).toBe('true')
    await wrapper.get('input').trigger('blur')
    expect(shown(wrapper)).toEqual([])
  })

  it('фильтрует по вхождению без учёта регистра и прячет точное совпадение', async () => {
    const wrapper = mountCombo('OV')
    await wrapper.get('input').trigger('focus')
    expect(shown(wrapper)).toEqual([
      'e.sokolova',
      'i.petrov',
      'v.kuznetsova',
      'a.morozov',
      'm.antonov',
    ])
    await wrapper.setProps({ modelValue: 'i.petrov' })
    expect(shown(wrapper)).toEqual([])
  })

  it('показывает не больше 8 подсказок', async () => {
    const many = Array.from({ length: 12 }, (_, index) => `user${String(index)}`)
    const wrapper = mountCombo('', many)
    await wrapper.get('input').trigger('focus')
    expect(shown(wrapper)).toHaveLength(8)
  })

  it('ввод отдаётся наружу как есть', async () => {
    const wrapper = mountCombo()
    await wrapper.get('input').setValue('a.mo')
    expect(wrapper.emitted('update:modelValue')).toEqual([['a.mo']])
  })

  it('стрелками выбирается подсказка, Enter её подставляет', async () => {
    const wrapper = mountCombo('ov')
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toMatch(/-opt-1$/)
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['i.petrov']])
    expect(shown(wrapper)).toEqual([])
  })

  it('ArrowUp с начала уходит на последнюю подсказку', async () => {
    const wrapper = mountCombo('ov')
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowUp' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['m.antonov']])
  })

  it('Enter без выбранной подсказки ничего не подставляет', async () => {
    const wrapper = mountCombo('ov')
    await wrapper.get('input').trigger('focus')
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('мышью подсказка выбирается по mousedown, до blur', async () => {
    const wrapper = mountCombo()
    await wrapper.get('input').trigger('focus')
    await wrapper.findAll('[role="option"] button')[3]?.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toEqual([['a.morozov']])
  })

  it('Escape закрывает список', async () => {
    const wrapper = mountCombo()
    await wrapper.get('input').trigger('focus')
    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    expect(shown(wrapper)).toEqual([])
  })
})

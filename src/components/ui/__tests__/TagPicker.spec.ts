// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TagPicker from '@/components/ui/TagPicker.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const suggestions = ['Python', 'PostgreSQL', 'Vue', 'Docker']

function mountPicker(modelValue: string[] = []) {
  return mount(TagPicker, { props: { modelValue, suggestions } })
}

function lastEmitted(wrapper: VueWrapper): unknown {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0]
}

function shown(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[role="option"]').map((option) => option.text())
}

describe('TagPicker', () => {
  it('Enter и запятая добавляют набранный тег без пробелов по краям', async () => {
    const wrapper = mountPicker(['Vue'])
    const input = wrapper.get('input')
    await input.setValue('  Redis ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(lastEmitted(wrapper)).toEqual(['Vue', 'Redis'])
    expect((input.element as HTMLInputElement).value).toBe('')

    await input.setValue('Kafka')
    await input.trigger('keydown', { key: ',' })
    expect(lastEmitted(wrapper)).toEqual(['Vue', 'Kafka'])
  })

  it('не добавляет дубликат с другим регистром и пустую строку', async () => {
    const wrapper = mountPicker(['Vue'])
    const input = wrapper.get('input')
    await input.setValue('vue')
    await input.trigger('keydown', { key: 'Enter' })
    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('уход из поля добавляет недописанный тег', async () => {
    const wrapper = mountPicker()
    await wrapper.get('input').setValue('Go')
    await wrapper.get('input').trigger('blur')
    expect(lastEmitted(wrapper)).toEqual(['Go'])
  })

  it('крестик убирает тег', async () => {
    const wrapper = mountPicker(['Vue', 'Docker'])
    await wrapper.get(`[aria-label="${t('ui.removeTag', { name: 'Vue' })}"]`).trigger('click')
    expect(lastEmitted(wrapper)).toEqual(['Docker'])
  })

  it('Backspace в пустом поле убирает последний тег', async () => {
    const wrapper = mountPicker(['Vue', 'Docker'])
    await wrapper.get('input').trigger('keydown', { key: 'Backspace' })
    expect(lastEmitted(wrapper)).toEqual(['Vue'])
  })

  it('Backspace при набранном тексте теги не трогает', async () => {
    const wrapper = mountPicker(['Vue'])
    await wrapper.get('input').setValue('Do')
    await wrapper.get('input').trigger('keydown', { key: 'Backspace' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('подсказки без уже выбранных и по набранному тексту', async () => {
    const wrapper = mountPicker(['vue'])
    await wrapper.get('input').trigger('focus')
    expect(shown(wrapper)).toEqual(['Python', 'PostgreSQL', 'Docker'])
    await wrapper.get('input').setValue('post')
    expect(shown(wrapper)).toEqual(['PostgreSQL'])
  })

  it('стрелка + Enter берут подсказку, а не набранный текст', async () => {
    const wrapper = mountPicker()
    const input = wrapper.get('input')
    await input.trigger('focus')
    await input.setValue('p')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(lastEmitted(wrapper)).toEqual(['PostgreSQL'])
  })

  it('плейсхолдер только пока тегов нет', () => {
    expect(mountPicker().get('input').attributes('placeholder')).toBe(t('ui.addTag'))
    expect(mountPicker(['Vue']).get('input').attributes('placeholder')).toBe('')
  })
})

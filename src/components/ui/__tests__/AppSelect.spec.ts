// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import AppSelect from '@/components/ui/AppSelect.vue'

const options = [
  { value: '', label: 'не выбрано' },
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
]

function mountSelect(modelValue: string, placeholder: string | null = null) {
  return mount(AppSelect, {
    props: { modelValue, options, label: 'специализация', placeholder },
    attachTo: document.body,
  })
}

async function open(wrapper: ReturnType<typeof mountSelect>): Promise<void> {
  await wrapper.get('button').trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

function item(label: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>('.app-select-item')].find((node) =>
    node.textContent.includes(label),
  )
  if (!found) throw new Error(`no option «${label}»`)
  return found
}

/** Выбор клавиатурой: click reka-ui не слушает, а pointer-события в happy-dom
    без pointerType не доходят до обработчика. */
async function choose(label: string): Promise<void> {
  const node = item(label)
  node.focus()
  node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await flushPromises()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AppSelect', () => {
  it('показывает подпись пустой опции, когда выбрано «не выбрано»', () => {
    const wrapper = mountSelect('')
    expect(wrapper.get('button').text()).toContain('не выбрано')
    wrapper.unmount()
  })

  it('открывается со списком, где есть опция с пустым значением', async () => {
    const wrapper = mountSelect('backend')
    await open(wrapper)
    expect(item('не выбрано')).toBeTruthy()
    expect(item('Frontend')).toBeTruthy()
    wrapper.unmount()
  })

  it('отдаёт наружу пустую строку, а не служебный ключ', async () => {
    const wrapper = mountSelect('backend')
    await open(wrapper)
    await choose('не выбрано')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    wrapper.unmount()
  })

  it('отдаёт выбранное непустое значение', async () => {
    const wrapper = mountSelect('')
    await open(wrapper)
    await choose('Frontend')
    expect(wrapper.emitted('update:modelValue')).toEqual([['frontend']])
    wrapper.unmount()
  })
})

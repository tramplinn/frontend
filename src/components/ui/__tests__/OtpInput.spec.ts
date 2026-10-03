// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import OtpInput from '@/components/ui/OtpInput.vue'

function mountOtp(modelValue = '', length = 6) {
  return mount(OtpInput, { props: { modelValue, length }, attachTo: document.body })
}

function cells(wrapper: VueWrapper) {
  return wrapper.findAll('input')
}

function values(wrapper: VueWrapper): string[] {
  return cells(wrapper).map((cell) => (cell.element as HTMLInputElement).value)
}

async function type(wrapper: VueWrapper, index: number, text: string): Promise<void> {
  const cell = cells(wrapper)[index]
  if (!cell) throw new Error(`no cell ${String(index)}`)
  await cell.setValue(text)
  await flushPromises()
}

async function paste(wrapper: VueWrapper, index: number, text: string): Promise<void> {
  const cell = cells(wrapper)[index]
  if (!cell) throw new Error(`no cell ${String(index)}`)
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.assign(event, { clipboardData: { getData: () => text } })
  cell.element.dispatchEvent(event)
  await flushPromises()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('OtpInput', () => {
  it('раскладывает modelValue по ячейкам, отбрасывая не-цифры', () => {
    const wrapper = mountOtp('12a3')
    expect(values(wrapper)).toEqual(['1', '2', '3', '', '', ''])
  })

  it('цифра заполняет ячейку и переводит фокус на следующую', async () => {
    const wrapper = mountOtp()
    await type(wrapper, 0, '7')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['7'])
    expect(document.activeElement).toBe(cells(wrapper)[1]?.element)
  })

  it('буквы в ячейку не попадают', async () => {
    const wrapper = mountOtp()
    await type(wrapper, 0, 'x')
    expect(values(wrapper)[0]).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('вставка кода заполняет все ячейки и сообщает complete', async () => {
    const wrapper = mountOtp()
    await paste(wrapper, 0, ' 123-456 ')
    expect(values(wrapper)).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['123456'])
    expect(wrapper.emitted('complete')).toEqual([['123456']])
  })

  it('ввод последней цифры вручную тоже сообщает complete', async () => {
    const wrapper = mountOtp('12345')
    await type(wrapper, 5, '6')
    expect(wrapper.emitted('complete')).toEqual([['123456']])
  })

  it('неполный код не считается complete', async () => {
    const wrapper = mountOtp()
    await paste(wrapper, 0, '123')
    expect(wrapper.emitted('complete')).toBeUndefined()
  })

  it('Backspace в пустой ячейке стирает предыдущую и уходит в неё', async () => {
    const wrapper = mountOtp('12')
    await cells(wrapper)[2]?.trigger('keydown', { key: 'Backspace' })
    await flushPromises()
    expect(values(wrapper)).toEqual(['1', '', '', '', '', ''])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['1'])
    expect(document.activeElement).toBe(cells(wrapper)[1]?.element)
  })

  it('стрелки двигают фокус', async () => {
    const wrapper = mountOtp()
    await cells(wrapper)[2]?.trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    expect(document.activeElement).toBe(cells(wrapper)[1]?.element)
    await cells(wrapper)[1]?.trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(document.activeElement).toBe(cells(wrapper)[2]?.element)
  })

  it('внешний сброс modelValue очищает ячейки', async () => {
    const wrapper = mountOtp('123456')
    await wrapper.setProps({ modelValue: '' })
    expect(values(wrapper)).toEqual(['', '', '', '', '', ''])
  })
})

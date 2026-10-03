// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ProgressBar from '@/components/ui/ProgressBar.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

function fillWidth(value: number, max: number): string | undefined {
  const fill = mount(ProgressBar, { props: { value, max } }).get('.fill')
  return (fill.element as HTMLElement).style.width
}

describe('ProgressBar', () => {
  it('округляет процент', () => {
    expect(fillWidth(1, 3)).toBe('33%')
    expect(fillWidth(2, 3)).toBe('67%')
    expect(fillWidth(5, 5)).toBe('100%')
  })

  it('при max = 0 показывает 0%, а не NaN', () => {
    expect(fillWidth(0, 0)).toBe('0%')
  })

  it('подписан для скринридеров', () => {
    expect(mount(ProgressBar, { props: { value: 1, max: 2 } }).attributes('aria-label')).toBe(
      t('ui.progress'),
    )
    expect(
      mount(ProgressBar, { props: { value: 1, max: 2, label: 'модуль 1' } }).attributes(
        'aria-label',
      ),
    ).toBe('модуль 1')
  })
})

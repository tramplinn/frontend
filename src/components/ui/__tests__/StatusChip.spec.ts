// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import StatusChip from '@/components/ui/StatusChip.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

describe('StatusChip', () => {
  it.each([
    ['published', t('ui.published')],
    ['draft', t('ui.draft')],
  ] as const)('%s', (status, label) => {
    const chip = mount(StatusChip, { props: { status } }).get('span')
    expect(chip.text()).toBe(label)
    expect(chip.classes()).toContain(`chip--${status}`)
  })
})

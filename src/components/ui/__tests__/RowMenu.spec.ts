// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

/** Меню строки как на месте вызова: обычный пункт и опасный с подтверждением. */
const Host = defineComponent({
  components: { RowMenu, RowMenuItem },
  props: { disabled: { type: Boolean, default: false } },
  setup() {
    const log = ref<string[]>([])
    return { log }
  },
  template: `
    <RowMenu label="действия с курсом" :disabled="disabled">
      <RowMenuItem @select="log.push('edit')">редактировать</RowMenuItem>
      <RowMenuItem danger @select="log.push('delete')">удалить</RowMenuItem>
    </RowMenu>
  `,
})

function mountMenu(disabled = false) {
  return mount(Host, { props: { disabled }, attachTo: document.body })
}

async function open(wrapper: ReturnType<typeof mountMenu>): Promise<void> {
  await wrapper.get('button').trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

function items(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')]
}

function item(label: string): HTMLElement {
  const found = items().find((node) => node.textContent.includes(label))
  if (!found) throw new Error(`no menu item «${label}»`)
  return found
}

/** Пункт выбирается клавиатурой: pointer-события reka-ui в happy-dom не доходят. */
async function choose(node: HTMLElement): Promise<void> {
  node.focus()
  node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await flushPromises()
}

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('RowMenu', () => {
  it('триггер подписан и меню закрыто до нажатия', () => {
    const wrapper = mountMenu()
    expect(wrapper.get('button').attributes('aria-label')).toBe('действия с курсом')
    expect(items()).toEqual([])
    wrapper.unmount()
  })

  it('без своей подписи триггер берёт общую', () => {
    const wrapper = mount(RowMenu, { attachTo: document.body })
    expect(wrapper.get('button').attributes('aria-label')).toBe(t('ui.actions'))
    wrapper.unmount()
  })

  it('открывается и показывает пункты', async () => {
    const wrapper = mountMenu()
    await open(wrapper)
    expect(items().map((node) => node.textContent.trim())).toEqual(['редактировать', 'удалить'])
    wrapper.unmount()
  })

  it('заблокированное меню не открывается', async () => {
    const wrapper = mountMenu(true)
    await open(wrapper)
    expect(items()).toEqual([])
    wrapper.unmount()
  })

  it('обычный пункт срабатывает с первого раза', async () => {
    const wrapper = mountMenu()
    await open(wrapper)
    await choose(item('редактировать'))
    expect(wrapper.vm.log).toEqual(['edit'])
    wrapper.unmount()
  })

  it('опасный пункт сперва просит подтверждения и меню не закрывает', async () => {
    const wrapper = mountMenu()
    await open(wrapper)
    await choose(item('удалить'))
    expect(wrapper.vm.log).toEqual([])
    const armed = item(t('ui.confirmDelete'))
    await choose(armed)
    expect(wrapper.vm.log).toEqual(['delete'])
    wrapper.unmount()
  })

  it('подтверждение опасного пункта гаснет через 4 секунды', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = mountMenu()
    await open(wrapper)
    await choose(item('удалить'))
    vi.advanceTimersByTime(4000)
    await flushPromises()
    expect(item('удалить').textContent.trim()).toBe('удалить')
    await choose(item('удалить'))
    expect(wrapper.vm.log).toEqual([])
    wrapper.unmount()
  })
})

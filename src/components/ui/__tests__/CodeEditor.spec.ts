// @vitest-environment happy-dom
import { EditorView } from '@codemirror/view'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

function mountEditor(props: Record<string, unknown> = {}) {
  return mount(CodeEditor, {
    props: { modelValue: 'print(1)', ...props },
    attachTo: document.body,
  })
}

function editorView(wrapper: VueWrapper): EditorView {
  const dom = (wrapper.element as HTMLElement).querySelector<HTMLElement>('.cm-editor')
  const view = dom ? EditorView.findFromDOM(dom) : null
  if (!view) throw new Error('editor is not mounted')
  return view
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('CodeEditor', () => {
  it('показывает переданный код и подписан для скринридеров', () => {
    const wrapper = mountEditor()
    expect(editorView(wrapper).state.doc.toString()).toBe('print(1)')
    expect(wrapper.get('.cm-content').attributes('aria-label')).toBe(t('ui.codeEditor'))
    wrapper.unmount()
  })

  it('правка в редакторе уходит наружу', () => {
    const wrapper = mountEditor()
    const view = editorView(wrapper)
    view.dispatch({ changes: { from: view.state.doc.length, insert: '\nprint(2)' } })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['print(1)\nprint(2)'])
    wrapper.unmount()
  })

  it('внешняя смена значения заменяет документ целиком', async () => {
    const wrapper = mountEditor()
    await wrapper.setProps({ modelValue: 'def solve():\n    pass' })
    expect(editorView(wrapper).state.doc.toString()).toBe('def solve():\n    pass')
    wrapper.unmount()
  })

  it('то же значение извне не трогает документ и курсор', async () => {
    const wrapper = mountEditor()
    const view = editorView(wrapper)
    view.dispatch({ selection: { anchor: 3 } })
    await wrapper.setProps({ modelValue: 'print(1)' })
    expect(view.state.selection.main.head).toBe(3)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('readonly переключается на лету', async () => {
    const wrapper = mountEditor({ readonly: true })
    expect(editorView(wrapper).state.readOnly).toBe(true)
    await wrapper.setProps({ readonly: false })
    expect(editorView(wrapper).state.readOnly).toBe(false)
    wrapper.unmount()
  })

  it('смена языка не ломает редактор и не теряет текст', async () => {
    const wrapper = mountEditor()
    for (const language of ['javascript', 'typescript', 'cpp', 'java', 'go', 'csharp', 'kotlin']) {
      await wrapper.setProps({ language })
    }
    expect(editorView(wrapper).state.doc.toString()).toBe('print(1)')
    wrapper.unmount()
  })

  it('при размонтировании уничтожает EditorView', () => {
    const wrapper = mountEditor()
    const view = editorView(wrapper)
    wrapper.unmount()
    expect(view.dom.isConnected).toBe(false)
  })
})

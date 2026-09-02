import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '@/lib/markdown'

describe('renderMarkdown', () => {
  it('оформляет списки и инлайновый код', () => {
    const html = renderMarkdown('Смотри:\n\n- первый `x = 1`\n- второй')

    expect(html).toContain('<ul>')
    expect(html).toContain('<code>x = 1</code>')
  })

  it('оформляет блок кода с языком', () => {
    const html = renderMarkdown('```python\nprint(1)\n```')

    expect(html).toContain('<pre>')
    expect(html).toContain('language-python')
  })

  it('экранирует сырой html из ответа модели', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')

    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('не превращает javascript-ссылку в ссылку', () => {
    const html = renderMarkdown('[клик](javascript:alert(1))')

    expect(html).not.toContain('<a ')
    expect(html).not.toContain('href')
  })
})

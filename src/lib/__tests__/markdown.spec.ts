import { describe, expect, it } from 'vitest'

import { renderMarkdown, renderReadme } from '@/lib/markdown'

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

describe('renderReadme', () => {
  it('открывает ссылки в новой вкладке без передачи opener', () => {
    const html = renderReadme('[репо](https://gitlab.com/a/b)')

    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="nofollow noopener noreferrer"')
  })

  it('не исполняет сырой html', () => {
    const html = renderReadme('<script>alert(1)</script><img src=x onerror=alert(1)>')

    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img')
  })

  it('пропускает картинки только по https', () => {
    expect(renderReadme('![лого](https://cdn.example.com/a.png)')).toContain(
      '<img src="https://cdn.example.com/a.png"',
    )
    const insecure = renderReadme('![лого](http://cdn.example.com/a.png)')
    expect(insecure).not.toContain('<img')
    expect(insecure).toContain('лого')
    expect(renderReadme('![x](javascript:alert(1))')).not.toContain('<img')
  })
})

import MarkdownIt from 'markdown-it'

// html: false — сырой HTML из ответа модели экранируется, а не исполняется,
// поэтому отдельный санитайзер не нужен: то же решение, что и у body_html на бэкенде.
// Ссылки markdown-it проверяет сам и javascript:/vbscript: не пропускает.
const renderer = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

export function renderMarkdown(source: string): string {
  return renderer.render(source)
}

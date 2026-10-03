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

// README проектов пишут пользователи для чужих глаз: ссылки уводим в новую вкладку
// без передачи веса и opener, а картинки берём только по https — http-ресурс на
// https-странице браузер всё равно заблокирует, а data:/javascript: не нужны вовсе.
const readmeRenderer = new MarkdownIt({ html: false, linkify: true })

readmeRenderer.renderer.rules.link_open = (tokens, index, options, _env, self) => {
  const token = tokens[index]
  if (token) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'nofollow noopener noreferrer')
  }
  return self.renderToken(tokens, index, options)
}

const renderImage = readmeRenderer.renderer.rules.image
readmeRenderer.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index]
  const src = String(token?.attrGet('src') ?? '')
  if (!token || !src.toLowerCase().startsWith('https://')) {
    return readmeRenderer.utils.escapeHtml(token?.content ?? '')
  }
  token.attrSet('loading', 'lazy')
  return renderImage
    ? renderImage(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options)
}

export function renderReadme(source: string): string {
  return readmeRenderer.render(source)
}

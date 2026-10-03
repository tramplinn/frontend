import { afterEach, beforeEach, vi } from 'vitest'

/* Предупреждения Vue («Unhandled error during execution of setup function» и
   т.п.) означают, что компонент смонтировался сломанным, даже если проверка
   в самом тесте прошла. Такие тесты должны падать, а не тихо зеленеть. */
let vueWarnings: string[] = []

function collectVueWarnings(original: (...args: unknown[]) => void) {
  return (...args: unknown[]): void => {
    const text = args.map(String).join(' ')
    if (text.includes('[Vue warn]')) {
      vueWarnings.push(text)
    }
    original(...args)
  }
}

beforeEach(() => {
  vueWarnings = []
  // Оригиналы берём до spyOn: аргумент mockImplementation вычисляется уже
  // после подмены, и console.warn там был бы самим шпионом — рекурсия.
  const warn = console.warn.bind(console)
  const error = console.error.bind(console)
  vi.spyOn(console, 'warn').mockImplementation(collectVueWarnings(warn))
  vi.spyOn(console, 'error').mockImplementation(collectVueWarnings(error))
})

afterEach(() => {
  vi.restoreAllMocks()
  if (vueWarnings.length > 0) {
    throw new Error(`Vue warnings during test:\n${vueWarnings.join('\n\n')}`)
  }
})

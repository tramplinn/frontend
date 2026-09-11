/**
 * После деплоя старые JS-чанки (имена захешированы по содержимому) пропадают с сервера —
 * контейнер пересобирается целиком. Если вкладка была открыта до деплоя, переход на ещё не
 * загруженный в этой сессии роут пытается скачать чанк по старому хэшу и падает. Ловим такую
 * ошибку и один раз перезагружаем страницу, чтобы подтянуть актуальный билд.
 */
const RELOAD_FLAG = 'tramplin:stale-chunk-reload'

const STALE_CHUNK_PATTERN =
  /dynamically imported module|importing a module script failed|error loading dynamically imported module/i

function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return STALE_CHUNK_PATTERN.test(message)
}

export function reloadOnStaleChunk(error: unknown): void {
  if (!isStaleChunkError(error)) return
  if (sessionStorage.getItem(RELOAD_FLAG) === '1') return
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
}

/** Снимает защиту от повторной перезагрузки — вызывать после успешной загрузки страницы. */
export function clearStaleChunkGuard(): void {
  sessionStorage.removeItem(RELOAD_FLAG)
}

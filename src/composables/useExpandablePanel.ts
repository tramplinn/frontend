import { computed, onBeforeUnmount, readonly, ref } from 'vue'
import type { ComputedRef, DeepReadonly, Ref } from 'vue'

/** Тот же порог, на котором вёрстка сворачивается в одну колонку. */
const PHONE = '(max-width: 800px)'

let locks = 0

function lockPageScroll(): void {
  if (locks++ === 0) {
    document.body.style.overflow = 'hidden'
  }
}

function releasePageScroll(): void {
  if (locks > 0 && --locks === 0) {
    document.body.style.overflow = ''
  }
}

/**
 * Раскрывающаяся панель боковой колонки (карта курса, чат-ассистент).
 *
 * На телефоне колонка уезжает под длинный текст урока, поэтому раскрытая
 * панель показывается шторкой на весь экран: иначе она разворачивается ниже
 * сгиба — непонятно, где именно, — и перехватывает вертикальный свайп,
 * из-за чего страница перестаёт прокручиваться.
 */
export function useExpandablePanel(storageKey: string): {
  expanded: DeepReadonly<Ref<boolean>>
  sheet: ComputedRef<boolean>
  toggle: () => void
  close: () => void
} {
  const media = window.matchMedia(PHONE)
  const expanded = ref(read())
  const phone = ref(media.matches)
  const sheet = computed(() => expanded.value && phone.value)

  let locked = false

  function read(): boolean {
    // Приватный режим и заблокированное хранилище кидают на самом доступе.
    try {
      return localStorage.getItem(storageKey) === 'expanded'
    } catch {
      return false
    }
  }

  function syncLock(): void {
    if (sheet.value === locked) return
    locked = sheet.value
    if (locked) {
      lockPageScroll()
    } else {
      releasePageScroll()
    }
  }

  function set(value: boolean): void {
    expanded.value = value
    syncLock()
    try {
      localStorage.setItem(storageKey, value ? 'expanded' : 'collapsed')
    } catch {
      // Состояние просто не переживёт перезагрузку — падать из-за этого незачем.
    }
  }

  function toggle(): void {
    set(!expanded.value)
  }

  function close(): void {
    if (expanded.value) set(false)
  }

  function onMedia(event: MediaQueryListEvent): void {
    phone.value = event.matches
    syncLock()
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && sheet.value) close()
  }

  media.addEventListener('change', onMedia)
  window.addEventListener('keydown', onKeydown)

  onBeforeUnmount(() => {
    media.removeEventListener('change', onMedia)
    window.removeEventListener('keydown', onKeydown)
    if (locked) {
      locked = false
      releasePageScroll()
    }
  })

  return { expanded: readonly(expanded), sheet, toggle, close }
}

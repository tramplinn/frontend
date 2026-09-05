import { computed, onBeforeUnmount, readonly, ref } from 'vue'
import type { ComputedRef, DeepReadonly, Ref } from 'vue'

import { safeGet, safeSet } from '@/lib/safeStorage'

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
    return safeGet('local', storageKey) === 'expanded'
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
    safeSet('local', storageKey, value ? 'expanded' : 'collapsed')
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

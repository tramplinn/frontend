import { readonly, ref } from 'vue'
import type { DeepReadonly, Ref } from 'vue'

export type ThemeChoice = 'system' | 'light' | 'dark'
export type VisibleTheme = Exclude<ThemeChoice, 'system'>

const STORAGE_KEY = 'tramplin:theme'
const ORDER: ThemeChoice[] = ['system', 'light', 'dark']

const choice = ref<ThemeChoice>(read())

function read(): ThemeChoice {
  // Приватный режим и заблокированное хранилище кидают на самом доступе.
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return ORDER.includes(stored as ThemeChoice) ? (stored as ThemeChoice) : 'system'
  } catch {
    return 'system'
  }
}

const SWITCHING_ATTR = 'data-theme-switching'

function apply(value: ThemeChoice): void {
  const root = document.documentElement
  if (value === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', value)
  }
}

/**
 * Смена темы переписывает все токены разом, но элементы с transition на цвете
 * доезжают до новой палитры на 120 мс позже соседей — это и читается как
 * отставание и мерцание. Гасим переходы ровно на время подмены.
 */
function applyWithoutTransitions(value: ThemeChoice): void {
  const root = document.documentElement
  root.setAttribute(SWITCHING_ATTR, '')
  apply(value)
  // Чтение геометрии заставляет браузер пересчитать стили с новыми цветами
  // до снятия флага, иначе оба изменения схлопнутся в один кадр с переходом.
  root.getBoundingClientRect()
  root.removeAttribute(SWITCHING_ATTR)
}

export function toggledTheme(value: ThemeChoice, systemIsDark: boolean): VisibleTheme {
  const visible = value === 'system' ? (systemIsDark ? 'dark' : 'light') : value
  return visible === 'dark' ? 'light' : 'dark'
}

function systemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme(): {
  choice: DeepReadonly<Ref<ThemeChoice>>
  set: (value: ThemeChoice) => void
  cycle: () => void
} {
  function set(value: ThemeChoice): void {
    choice.value = value
    applyWithoutTransitions(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Тема просто не переживёт перезагрузку — это не повод падать.
    }
  }

  function cycle(): void {
    set(toggledTheme(choice.value, systemIsDark()))
  }

  return { choice: readonly(choice), set, cycle }
}

export function initTheme(): void {
  apply(choice.value)
}

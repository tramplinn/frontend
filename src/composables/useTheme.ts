import { readonly, ref } from 'vue'
import type { DeepReadonly, Ref } from 'vue'

import { safeGet, safeSet } from '@/lib/safeStorage'

export type ThemeChoice = 'system' | 'light' | 'dark'
export type VisibleTheme = Exclude<ThemeChoice, 'system'>

const STORAGE_KEY = 'tramplin:theme'
const ORDER: ThemeChoice[] = ['system', 'light', 'dark']

const choice = ref<ThemeChoice>(read())

function read(): ThemeChoice {
  const stored = safeGet('local', STORAGE_KEY)
  return ORDER.includes(stored as ThemeChoice) ? (stored as ThemeChoice) : 'system'
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

function applyWithoutTransitions(value: ThemeChoice): void {
  const root = document.documentElement
  root.setAttribute(SWITCHING_ATTR, '')
  apply(value)
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
    safeSet('local', STORAGE_KEY, value)
  }

  function cycle(): void {
    set(toggledTheme(choice.value, systemIsDark()))
  }

  return { choice: readonly(choice), set, cycle }
}

export function initTheme(): void {
  apply(choice.value)
}

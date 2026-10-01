import { readonly, ref, watch } from 'vue'
import type { DeepReadonly, Ref } from 'vue'

import { safeGet, safeSet } from '@/lib/safeStorage'

import type { Locale } from './locale'
import { LOCALE_TAGS, parseLocale, resolveLocale } from './locale'
import { en } from './messages/en'
import { ru } from './messages/ru'
import type { MessageKey, MessageParams, Messages, PluralForms, PluralKey } from './types'

export type { Locale } from './locale'
export { DEFAULT_LOCALE, LOCALES, parseLocale } from './locale'
export type { MessageKey, PluralKey } from './types'

const STORAGE_KEY = 'tramplin:locale'
const DICTIONARIES: Record<Locale, Messages> = { ru, en }

/** До публичного запуска переключатель виден только в сборках для команды;
    без флага интерфейс целиком остаётся на русском — это же и способ отката. */
export const localeSwitcherEnabled = import.meta.env.VITE_LOCALE_SWITCHER === 'true'

/** Откуда взят текущий язык сессии: от этого зависит, что делать при входе. */
type LocaleSource = 'default' | 'stored' | 'url' | 'profile' | 'choice'

const initialUrl = localeSwitcherEnabled ? urlLocale() : null
const initialStored = localeSwitcherEnabled ? safeGet('local', STORAGE_KEY) : null
const current = ref<Locale>(
  resolveLocale({ url: initialUrl, profile: null, stored: initialStored }),
)
let source: LocaleSource =
  parseLocale(initialUrl) !== null
    ? 'url'
    : parseLocale(initialStored) !== null
      ? 'stored'
      : 'default'

function urlLocale(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('locale')
  } catch {
    return null
  }
}

function lookup(dictionary: Messages, key: string): unknown {
  let node: unknown = dictionary
  for (const part of key.split('.')) {
    node =
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined
  }
  return node
}

function interpolate(template: string, params: MessageParams | undefined): string {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export function translate(key: MessageKey, params?: MessageParams): string {
  const value = lookup(DICTIONARIES[current.value], key)
  return typeof value === 'string' ? interpolate(value, params) : key
}

const pluralRules = new Map<Locale, Intl.PluralRules>()

function pluralRule(locale: Locale): Intl.PluralRules {
  let rule = pluralRules.get(locale)
  if (!rule) {
    rule = new Intl.PluralRules(LOCALE_TAGS[locale])
    pluralRules.set(locale, rule)
  }
  return rule
}

export function translatePlural(key: PluralKey, count: number, params?: MessageParams): string {
  const forms = lookup(DICTIONARIES[current.value], key) as PluralForms | undefined
  if (!forms) {
    return key
  }
  const category = pluralRule(current.value).select(count)
  const template = forms[category] ?? forms.other
  return interpolate(template, { count: formatNumber(count), ...params })
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LOCALE_TAGS[current.value], options).format(value)
}

export function formatDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[current.value], options).format(new Date(value))
}

export function currentLocale(): Locale {
  return current.value
}

export function localeSource(): LocaleSource {
  return source
}

/** Ручной выбор: действует сразу и запоминается в браузере. Профиль обновляет useLocaleSync. */
export function chooseLocale(value: Locale): void {
  source = 'choice'
  current.value = value
  safeSet('local', STORAGE_KEY, value)
}

/** Язык из ссылки или профиля: меняет сессию, но не сохранённый выбор браузера. */
export function applyLocale(value: Locale, from: Extract<LocaleSource, 'url' | 'profile'>): void {
  if (!localeSwitcherEnabled) {
    return
  }
  source = from
  current.value = value
}

export function useI18n(): {
  locale: DeepReadonly<Ref<Locale>>
  t: typeof translate
  tc: typeof translatePlural
  d: typeof formatDate
  n: typeof formatNumber
} {
  return {
    locale: readonly(current),
    t: translate,
    tc: translatePlural,
    d: formatDate,
    n: formatNumber,
  }
}

/** Держит `lang` и заголовок документа в согласии с языком интерфейса. */
export function initLocale(): void {
  watch(
    current,
    (value) => {
      document.documentElement.lang = value
      document.title = DICTIONARIES[value].app.title
    },
    { immediate: true },
  )
}

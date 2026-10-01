import { afterEach, describe, expect, it } from 'vitest'

import { chooseLocale, formatDate, translate, translatePlural } from '@/i18n'
import { resolveLocale } from '@/i18n/locale'
import { en } from '@/i18n/messages/en'
import { ru } from '@/i18n/messages/ru'

type Tree = { [key: string]: string | Tree }

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      result.set(path, value)
    } else {
      for (const [nested, text] of leaves(value, path)) {
        result.set(nested, text)
      }
    }
  }
  return result
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort()
}

const PLURAL_FORMS = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])

function isPluralForm(path: string): boolean {
  return PLURAL_FORMS.has(path.slice(path.lastIndexOf('.') + 1))
}

function pluralGroup(path: string): string {
  return path.slice(0, path.lastIndexOf('.'))
}

describe('resolveLocale', () => {
  it('prefers the link, then the profile, then the browser choice', () => {
    expect(resolveLocale({ url: 'en', profile: 'ru', stored: 'ru' })).toBe('en')
    expect(resolveLocale({ url: null, profile: 'en', stored: 'ru' })).toBe('en')
    expect(resolveLocale({ url: null, profile: null, stored: 'en' })).toBe('en')
  })

  it('falls back to Russian and skips unknown values', () => {
    expect(resolveLocale({ url: null, profile: null, stored: null })).toBe('ru')
    expect(resolveLocale({ url: 'de', profile: 'xx', stored: 'en' })).toBe('en')
  })
})

describe('dictionaries', () => {
  const ruLeaves = leaves(ru)
  const enLeaves = leaves(en as unknown as Tree)

  it('have the same plain keys', () => {
    const plain = (map: Map<string, string>): string[] =>
      [...map.keys()].filter((path) => !isPluralForm(path)).sort()
    expect(plain(enLeaves)).toEqual(plain(ruLeaves))
  })

  it('cover every plural category of their language', () => {
    const groups = new Set([...ruLeaves.keys()].filter(isPluralForm).map(pluralGroup))
    for (const [tree, locale] of [
      [ruLeaves, 'ru-RU'],
      [enLeaves, 'en-US'],
    ] as const) {
      const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories
      for (const group of groups) {
        for (const category of categories) {
          expect(tree.get(`${group}.${category}`), `${locale} ${group}.${category}`).toBeTruthy()
        }
      }
    }
  })

  it('have no empty strings', () => {
    for (const [path, text] of [...ruLeaves, ...enLeaves]) {
      expect(text.trim(), path).not.toBe('')
    }
  })

  it('use the same placeholders in both languages', () => {
    for (const [path, text] of enLeaves) {
      if (isPluralForm(path)) {
        expect(placeholders(text), path).toEqual(
          placeholders(ruLeaves.get(`${pluralGroup(path)}.other`) ?? ''),
        )
      } else {
        expect(placeholders(text), path).toEqual(placeholders(ruLeaves.get(path) ?? ''))
      }
    }
  })
})

describe('translate', () => {
  afterEach(() => {
    chooseLocale('ru')
  })

  it('switches the whole interface language at once', () => {
    expect(translate('auth.codeSent', { email: 'a@b.c' })).toBe('код отправлен на a@b.c')
    chooseLocale('en')
    expect(translate('auth.codeSent', { email: 'a@b.c' })).toBe('code sent to a@b.c')
  })

  it('picks plural forms by language rules', () => {
    expect(translatePlural('units.hours', 1)).toBe('1 час')
    expect(translatePlural('units.hours', 3)).toBe('3 часа')
    expect(translatePlural('units.hours', 11)).toBe('11 часов')
    chooseLocale('en')
    expect(translatePlural('units.hours', 1)).toBe('1 hour')
    expect(translatePlural('units.hours', 3)).toBe('3 hours')
  })

  it('formats dates for the interface language', () => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' } as const
    expect(formatDate('2026-09-03T18:56:13Z', options)).toBe('3 сентября 2026 г.')
    chooseLocale('en')
    expect(formatDate('2026-09-03T18:56:13Z', options)).toBe('September 3, 2026')
  })
})

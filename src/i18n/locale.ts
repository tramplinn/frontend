export const LOCALES = ['ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

/** Языковые теги для Intl и атрибута `lang`. */
export const LOCALE_TAGS: Record<Locale, string> = { ru: 'ru-RU', en: 'en-US' }

export function parseLocale(value: unknown): Locale | null {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : null
}

export interface LocaleSources {
  /** `?locale=` из адреса — только для этой сессии, предпочтение он не переписывает. */
  url: unknown
  /** Сохранённое предпочтение вошедшего пользователя. */
  profile: unknown
  /** Выбор, сохранённый в этом браузере. */
  stored: unknown
}

/** Приоритет новой сессии: ссылка → профиль → браузер → `ru`.
    Язык браузера намеренно не учитываем. Неизвестные значения пропускаем. */
export function resolveLocale(sources: LocaleSources): Locale {
  return (
    parseLocale(sources.url) ??
    parseLocale(sources.profile) ??
    parseLocale(sources.stored) ??
    DEFAULT_LOCALE
  )
}

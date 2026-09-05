/** Пример акцентного цвета для полей ввода — совпадает с --accent из tokens.css. */
export const ACCENT_COLOR_PLACEHOLDER = '#2B7FFF'

/** Пустое поле формы — это «значения нет», а не пустая строка: бэкенд ждёт null. */
export function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function numberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

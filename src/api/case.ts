const toCamel = (key: string): string =>
  key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase())

const toSnake = (key: string): string => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys)
  }
  if (value === null || typeof value !== 'object') {
    return value
  }
  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source)) {
    result[toCamel(key)] = camelizeKeys(source[key])
  }
  return result
}

/** undefined выбрасываем: у бэкенда exclude_unset, «не передали» ≠ «сбросили в null». */
export function snakeBody(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(value)) {
    if (value[key] !== undefined) {
      result[toSnake(key)] = value[key]
    }
  }
  return result
}

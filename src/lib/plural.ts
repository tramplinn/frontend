export function plural(count: number, one: string, few: string, many: string): string {
  const tail = Math.abs(count) % 10
  const teen = Math.abs(count) % 100
  if (teen >= 11 && teen <= 14) {
    return many
  }
  if (tail === 1) {
    return one
  }
  if (tail >= 2 && tail <= 4) {
    return few
  }
  return many
}

export function withCount(count: number, one: string, few: string, many: string): string {
  return `${String(count)} ${plural(count, one, few, many)}`
}

import { translatePlural } from '@/i18n'

export function hours(value: number | null): string {
  return value === null ? '' : translatePlural('units.hours', value)
}

import { withCount } from '@/lib/plural'

export function hours(value: number | null): string {
  return value === null ? '' : withCount(value, 'час', 'часа', 'часов')
}

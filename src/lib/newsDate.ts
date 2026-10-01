import { formatDate } from '@/i18n'

/** Черновик ещё не опубликован, и подставлять ему дату правки нечестно. */
export function formatNewsDate(publishedAt: string | null): string {
  return publishedAt === null
    ? ''
    : formatDate(publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })
}

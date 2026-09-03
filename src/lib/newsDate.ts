const FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Черновик ещё не опубликован, и подставлять ему дату правки нечестно. */
export function formatNewsDate(publishedAt: string | null): string {
  return publishedAt === null ? '' : FORMAT.format(new Date(publishedAt))
}

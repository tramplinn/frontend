import { request } from './client'
import { newsPageSchema, newsSchema } from './schemas/news'
import type { News, NewsPage } from './schemas/news'

export interface NewsDraft {
  title: string
  slug: string
  summary?: string | null
  bodyMd?: string
  status?: 'draft' | 'published'
  photoIds?: string[]
}

export function listNews(limit = 20, offset = 0): Promise<NewsPage> {
  return request('/news', { schema: newsPageSchema, query: { limit, offset } })
}

export function getNews(slug: string): Promise<News> {
  return request(`/news/${encodeURIComponent(slug)}`, { schema: newsSchema })
}

export function listNewsDrafts(limit = 50, offset = 0): Promise<NewsPage> {
  return request('/authoring/news', { schema: newsPageSchema, query: { limit, offset } })
}

export function createNews(draft: NewsDraft): Promise<News> {
  return request('/authoring/news', { method: 'POST', body: toPayload(draft), schema: newsSchema })
}

export function updateNews(newsId: string, changes: Partial<NewsDraft>): Promise<News> {
  return request(`/authoring/news/${newsId}`, {
    method: 'PATCH',
    body: toPayload(changes),
    schema: newsSchema,
  })
}

export async function deleteNews(newsId: string): Promise<void> {
  await request(`/authoring/news/${newsId}`, { method: 'DELETE' })
}

/** Сервер ждёт snake_case и не терпит незаявленных полей (extra="forbid"). */
function toPayload(draft: Partial<NewsDraft>): Record<string, unknown> {
  return {
    ...(draft.title === undefined ? {} : { title: draft.title }),
    ...(draft.slug === undefined ? {} : { slug: draft.slug }),
    ...(draft.summary === undefined ? {} : { summary: draft.summary }),
    ...(draft.bodyMd === undefined ? {} : { body_md: draft.bodyMd }),
    ...(draft.status === undefined ? {} : { status: draft.status }),
    ...(draft.photoIds === undefined ? {} : { photo_ids: draft.photoIds }),
  }
}

import { request } from './client'
import { publicProfileSchema, publicUserPageSchema } from './schemas/users'
import type { PublicProfile, PublicUserPage } from './schemas/users'

export function searchPeople(query = '', limit = 24, offset = 0): Promise<PublicUserPage> {
  return request('/users', {
    query: { q: query || undefined, limit, offset },
    schema: publicUserPageSchema,
  })
}

export function getPublicProfile(login: string): Promise<PublicProfile> {
  return request(`/users/${encodeURIComponent(login)}`, { schema: publicProfileSchema })
}

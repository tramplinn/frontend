import { z } from 'zod'

import { request } from './client'
import { tagSchema, type Tag } from './schemas/tags'

export function listTags(): Promise<Tag[]> {
  return request('/authoring/tags', { schema: z.array(tagSchema) })
}

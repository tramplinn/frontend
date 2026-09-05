import { request } from './client'
import { recommendationsSchema } from './schemas/recommendations'
import type { Recommendations } from './schemas/recommendations'

export function listRecommendations(): Promise<Recommendations> {
  return request('/recommendations', { schema: recommendationsSchema })
}

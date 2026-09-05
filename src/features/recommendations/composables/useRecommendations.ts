import { onMounted, onUnmounted, ref } from 'vue'

import { listRecommendations } from '@/api/recommendations'
import type { RecommendedAlgorithm, RecommendedCourse } from '@/api/schemas/recommendations'

export function useRecommendations() {
  const courses = ref<RecommendedCourse[]>([])
  const algorithms = ref<RecommendedAlgorithm[]>([])
  const pending = ref(true)
  const error = ref<unknown>(null)

  let alive = true
  let version = 0

  async function load(): Promise<void> {
    const current = ++version
    pending.value = true
    error.value = null
    try {
      const recommendations = await listRecommendations()
      if (!alive || current !== version) return
      courses.value = recommendations.courses
      algorithms.value = recommendations.algorithms
    } catch (cause) {
      if (current === version) error.value = cause
    } finally {
      if (current === version) pending.value = false
    }
  }

  onMounted(() => void load())
  onUnmounted(() => {
    alive = false
    version += 1
  })

  return { courses, algorithms, pending, error }
}

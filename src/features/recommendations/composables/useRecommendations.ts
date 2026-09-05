import { onMounted, onUnmounted, ref } from 'vue'

import { listRecommendations } from '@/api/recommendations'
import type { RecommendedAlgorithm, RecommendedCourse } from '@/api/schemas/recommendations'
import { useVersionedLoad } from '@/composables/useVersionedLoad'

export function useRecommendations() {
  const courses = ref<RecommendedCourse[]>([])
  const algorithms = ref<RecommendedAlgorithm[]>([])
  const pending = ref(true)
  const error = ref<unknown>(null)

  const loadGuard = useVersionedLoad()

  async function load(): Promise<void> {
    const current = loadGuard.start()
    pending.value = true
    error.value = null
    try {
      const recommendations = await listRecommendations()
      if (!loadGuard.isCurrent(current)) return
      courses.value = recommendations.courses
      algorithms.value = recommendations.algorithms
    } catch (cause) {
      if (loadGuard.isCurrent(current)) error.value = cause
    } finally {
      if (loadGuard.isCurrent(current)) pending.value = false
    }
  }

  onMounted(() => void load())
  onUnmounted(() => {
    loadGuard.cancel()
  })

  return { courses, algorithms, pending, error }
}

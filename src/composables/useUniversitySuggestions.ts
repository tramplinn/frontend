import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import { listUniversities } from '@/api/directories'

let universityNames: Promise<string[]> | null = null

function loadUniversityNames(): Promise<string[]> {
  universityNames ??= listUniversities()
    .then((items) => items.map((university) => university.name))
    .catch(() => [])
  return universityNames
}

/** Список названий вузов для автодополнения — грузится один раз на сессию и переиспользуется. */
export function useUniversitySuggestions(): Ref<string[]> {
  const suggestions = ref<string[]>([])
  onMounted(() => {
    void loadUniversityNames().then((names) => (suggestions.value = names))
  })
  return suggestions
}

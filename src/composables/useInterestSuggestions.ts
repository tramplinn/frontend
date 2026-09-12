import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import { listInterests } from '@/api/directories'

let interestNames: Promise<string[]> | null = null

function loadInterestNames(): Promise<string[]> {
  interestNames ??= listInterests()
    .then((items) => items.map((interest) => interest.name))
    .catch(() => [])
  return interestNames
}

/** Список интересов для автодополнения — грузится один раз на сессию и переиспользуется. */
export function useInterestSuggestions(): Ref<string[]> {
  const suggestions = ref<string[]>([])
  onMounted(() => {
    void loadInterestNames().then((names) => (suggestions.value = names))
  })
  return suggestions
}

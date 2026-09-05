import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import { listTags } from '@/api/tags'

let tagNames: Promise<string[]> | null = null

function loadTagNames(): Promise<string[]> {
  tagNames ??= listTags()
    .then((items) => items.map((tag) => tag.name))
    .catch(() => [])
  return tagNames
}

/** Список имён тегов для автодополнения — грузится один раз на сессию и переиспользуется. */
export function useTagSuggestions(): Ref<string[]> {
  const suggestions = ref<string[]>([])
  onMounted(() => {
    void loadTagNames().then((names) => (suggestions.value = names))
  })
  return suggestions
}

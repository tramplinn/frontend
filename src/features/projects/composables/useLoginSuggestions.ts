import { onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

import { searchPeople } from '@/api/users'
import { useDebounce } from '@/composables/useDebounce'
import { useVersionedLoad } from '@/composables/useVersionedLoad'

const MIN_QUERY_LENGTH = 2

/** Подсказки логинов для приглашения: тот же поиск, что и в разделе «Люди». */
export function useLoginSuggestions(query: Ref<string>, delayMs = 250) {
  const suggestions = ref<string[]>([])
  const debounce = useDebounce(delayMs)
  const versions = useVersionedLoad()

  async function load(needle: string): Promise<void> {
    const token = versions.start()
    try {
      const page = await searchPeople(needle, 8)
      if (versions.isCurrent(token)) suggestions.value = page.items.map((item) => item.login)
    } catch {
      if (versions.isCurrent(token)) suggestions.value = []
    }
  }

  watch(query, (value) => {
    const needle = value.trim()
    if (needle.length < MIN_QUERY_LENGTH) {
      debounce.cancel()
      suggestions.value = []
      return
    }
    debounce.schedule(() => void load(needle))
  })
  onUnmounted(() => {
    debounce.cancel()
    versions.cancel()
  })

  return suggestions
}

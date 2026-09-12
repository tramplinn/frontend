import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import { listCompanies } from '@/api/directories'

let companyNames: Promise<string[]> | null = null

function loadCompanyNames(): Promise<string[]> {
  companyNames ??= listCompanies()
    .then((items) => items.map((company) => company.name))
    .catch(() => [])
  return companyNames
}

/** Список названий компаний для автодополнения — грузится один раз на сессию и переиспользуется. */
export function useCompanySuggestions(): Ref<string[]> {
  const suggestions = ref<string[]>([])
  onMounted(() => {
    void loadCompanyNames().then((names) => (suggestions.value = names))
  })
  return suggestions
}

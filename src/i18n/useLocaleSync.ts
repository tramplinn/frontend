import { readonly, ref, watch } from 'vue'

import { useAuthStore } from '@/stores/auth'

import type { Locale } from './locale'
import { parseLocale } from './locale'
import { applyLocale, chooseLocale, currentLocale, localeSource } from './index'

const saveFailed = ref(false)

/** Ручной выбор языка: сразу в интерфейсе и в браузере, у вошедшего — ещё и в профиле.
    Сбой сохранения не откатывает язык, а только поднимает флаг для подсказки. */
export async function selectLocale(value: Locale): Promise<void> {
  chooseLocale(value)
  saveFailed.value = false
  const auth = useAuthStore()
  if (!auth.isAuthenticated || auth.user?.preferredLocale === value) {
    return
  }
  try {
    await auth.updateProfile({ preferredLocale: value })
  } catch {
    if (currentLocale() === value) {
      saveFailed.value = true
    }
  }
}

export const localeSaveFailed = readonly(saveFailed)

/** Связывает язык сессии с профилем при восстановлении сессии и входе:
    явный выбор в этой сессии уходит в профиль, иначе профиль задаёт язык —
    кроме случая, когда язык явно пришёл из ссылки. */
export function installLocaleSync(): void {
  const auth = useAuthStore()
  watch(
    () => auth.user?.id ?? null,
    (userId, previousId) => {
      if (userId === null || userId === previousId) {
        return
      }
      const preferred = parseLocale(auth.user?.preferredLocale)
      const source = localeSource()
      if (source === 'choice') {
        if (preferred !== currentLocale()) {
          void selectLocale(currentLocale())
        }
        return
      }
      if (source !== 'url' && preferred !== null) {
        applyLocale(preferred, 'profile')
      }
    },
    { immediate: true },
  )
}

import { onBeforeUnmount, onMounted, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const DEFAULT_MESSAGE = 'Есть несохранённые изменения. Уйти со страницы?'

/** Предупреждает при уходе со страницы, пока dirty() истинно: и через роутер
    (клик по ссылке внутри приложения), и через закрытие/обновление вкладки. */
export function useUnsavedChangesGuard(
  dirty: MaybeRefOrGetter<boolean>,
  message = DEFAULT_MESSAGE,
): void {
  function guardUnload(event: BeforeUnloadEvent): void {
    if (toValue(dirty)) event.preventDefault()
  }

  onMounted(() => {
    window.addEventListener('beforeunload', guardUnload)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', guardUnload)
  })

  onBeforeRouteLeave(() => {
    if (!toValue(dirty)) return true
    return window.confirm(message)
  })
}

import { onBeforeUnmount, onMounted, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { translate } from '@/i18n'

/** Предупреждает при уходе со страницы, пока dirty() истинно: и через роутер
    (клик по ссылке внутри приложения), и через закрытие/обновление вкладки. */
export function useUnsavedChangesGuard(
  dirty: MaybeRefOrGetter<boolean>,
  message: () => string = () => translate('unsaved.default'),
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
    return window.confirm(message())
  })
}

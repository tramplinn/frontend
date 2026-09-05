import { computed, ref } from 'vue'

type PanelId = 'assistant' | 'feedback'

/** Модуль — не Pinia: два независимых плавающих виджета делят один слот,
    чтобы не открывались друг на друге сразу. Персистентность не нужна. */
const active = ref<PanelId | null>(null)

export function useFloatingPanel(id: PanelId) {
  const isOpen = computed(() => active.value === id)

  function open(): void {
    active.value = id
  }

  function close(): void {
    if (active.value === id) active.value = null
  }

  function toggle(): void {
    active.value = active.value === id ? null : id
  }

  return { isOpen, open, close, toggle }
}

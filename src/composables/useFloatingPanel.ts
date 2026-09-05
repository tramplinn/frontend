import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'

type PanelId = 'assistant' | 'feedback' | 'tutor'

const active = ref<PanelId | null>(null)

export interface FloatingPanel {
  isOpen: ComputedRef<boolean>
  open: () => void
  close: () => void
  toggle: () => void
}

export function useFloatingPanel(id: PanelId): FloatingPanel {
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

import { nextTick } from 'vue'
import type { Ref } from 'vue'

export interface CursorInsert {
  insertAtCursor: (text: string) => void
  replacePlaceholder: (placeholder: string, markdown: string) => void
}

export function useCursorInsert(
  field: Ref<HTMLTextAreaElement | null>,
  get: () => string | null,
  set: (value: string) => void,
): CursorInsert {
  function insertAtCursor(text: string): void {
    const current = get()
    if (current === null) return
    const element = field.value
    if (!element) {
      set(current + text)
      return
    }
    const start = element.selectionStart
    const end = element.selectionEnd
    set(current.slice(0, start) + text + current.slice(end))
    void nextTick(() => {
      const at = start + text.length
      element.focus()
      element.setSelectionRange(at, at)
    })
  }

  function replacePlaceholder(placeholder: string, markdown: string): void {
    const current = get()
    if (current === null) return
    // Функция, а не строка: иначе $&, $$ и т.п. в имени файла раскрылись бы как шаблоны замены.
    set(current.replace(placeholder, () => markdown))
  }

  return { insertAtCursor, replacePlaceholder }
}

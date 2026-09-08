import { onUnmounted, ref, type Ref } from 'vue'

export interface ArmedConfirm {
  armed: Ref<boolean>
  /** Первый вызов взводит подтверждение и возвращает false; повторный вызов,
      пока оно ещё взведено, снимает его и возвращает true — пора действовать. */
  press: () => boolean
}

/** Общий «нажми ещё раз, чтобы подтвердить» таймер: используется и в
    ConfirmButton, и в RowMenuItem — поведение должно быть идентичным. */
export function useArmedConfirm(timeoutMs = 4000): ArmedConfirm {
  const armed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function press(): boolean {
    if (armed.value) {
      clearTimeout(timer)
      armed.value = false
      return true
    }
    armed.value = true
    timer = setTimeout(() => (armed.value = false), timeoutMs)
    return false
  }

  onUnmounted(() => {
    clearTimeout(timer)
  })

  return { armed, press }
}

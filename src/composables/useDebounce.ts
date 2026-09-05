export interface Debounced {
  schedule(fn: () => void): void
  cancel(): void
}

export function useDebounce(delayMs: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | undefined

  function schedule(fn: () => void): void {
    clearTimeout(timer)
    timer = setTimeout(fn, delayMs)
  }

  function cancel(): void {
    clearTimeout(timer)
  }

  return { schedule, cancel }
}

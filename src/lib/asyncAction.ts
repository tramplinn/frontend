export interface BusyActionHandlers {
  setBusy: (active: boolean) => void
  clearError: () => void
  setError: (cause: unknown) => void
}

export async function runBusyAction(
  handlers: BusyActionHandlers,
  action: () => Promise<unknown>,
): Promise<void> {
  handlers.setBusy(true)
  handlers.clearError()
  try {
    await action()
  } catch (cause) {
    handlers.setError(cause)
  } finally {
    handlers.setBusy(false)
  }
}

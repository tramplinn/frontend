export interface VersionedLoad {
  start(): number
  peek(): number
  cancel(): void
  isCurrent(token: number): boolean
}

export function useVersionedLoad(): VersionedLoad {
  let version = 0

  function start(): number {
    return ++version
  }

  function peek(): number {
    return version
  }

  function cancel(): void {
    version += 1
  }

  function isCurrent(token: number): boolean {
    return token === version
  }

  return { start, peek, cancel, isCurrent }
}

type StorageKind = 'local' | 'session'

function storageOf(kind: StorageKind): Storage {
  return kind === 'local' ? localStorage : sessionStorage
}

export function safeGet(kind: StorageKind, key: string): string | null {
  try {
    return storageOf(kind).getItem(key)
  } catch {
    return null
  }
}

export function safeSet(kind: StorageKind, key: string, value: string): void {
  try {
    storageOf(kind).setItem(key, value)
  } catch {
    return
  }
}

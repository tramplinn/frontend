import { ApiError, ContractError, NetworkError } from '@/api/errors'
import { translate } from '@/i18n'

export type MissingContentKind = 'lesson' | 'quiz'

/** Текст собираем при показе, а не при создании: ошибка переживает смену языка. */
export class MissingContentError extends Error {
  readonly kind: MissingContentKind

  constructor(kind: MissingContentKind) {
    super(`${kind} not found`)
    this.kind = kind
    this.name = 'MissingContentError'
  }
}

export function errorText(error: unknown): string {
  if (error instanceof MissingContentError) {
    return translate(`errors.missing.${error.kind}`)
  }
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return translate('errors.unavailable')
    }
    return error.message
  }
  if (error instanceof NetworkError) {
    return translate('errors.network')
  }
  if (error instanceof ContractError) {
    return translate('errors.contract')
  }
  return translate('errors.unknown')
}

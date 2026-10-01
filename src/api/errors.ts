import { errorSchema } from './schemas/common'
import { translate } from '@/i18n'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isNotFound(): boolean {
    return this.status === 404
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Не удалось связаться с сервером', { cause })
    this.name = 'NetworkError'
  }
}

export class ContractError extends Error {
  constructor(path: string, cause: unknown) {
    super(`Ответ ${path} не соответствует схеме`, { cause })
    this.name = 'ContractError'
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    // Тело пустое или не JSON — остаётся только код статуса.
  }
  const parsed = errorSchema.safeParse(body)
  if (parsed.success) {
    return new ApiError(response.status, parsed.data.code, parsed.data.message, parsed.data.details)
  }
  return new ApiError(
    response.status,
    'http_error',
    translate('errors.http', { status: response.status }),
    {},
  )
}

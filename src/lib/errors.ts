import { ApiError, ContractError, NetworkError } from '@/api/errors'

export class MissingContentError extends Error {
  constructor(what: string) {
    super(`${what} не найден. Возможно, ссылка устарела.`)
    this.name = 'MissingContentError'
  }
}

export function errorText(error: unknown): string {
  if (error instanceof MissingContentError) {
    return error.message
  }
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof NetworkError) {
    return 'Сервер не отвечает. Проверьте соединение.'
  }
  if (error instanceof ContractError) {
    return 'Сервер вернул неожиданный ответ.'
  }
  return 'Что-то пошло не так.'
}

import { describe, expect, it } from 'vitest'

import { ApiError, ContractError, NetworkError } from '@/api/errors'
import { MissingContentError, errorText } from '@/lib/errors'

describe('errorText', () => {
  it('keeps safe domain messages', () => {
    expect(errorText(new MissingContentError('lesson'))).toBe(
      'Урок не найден. Возможно, ссылка устарела.',
    )
    expect(errorText(new ApiError(400, 'bad_request', 'Проверьте данные', {}))).toBe(
      'Проверьте данные',
    )
  })

  it('hides technical server failures', () => {
    expect(errorText(new ApiError(502, 'http_error', 'Ошибка 502', {}))).toBe(
      'Сервис временно недоступен. Попробуйте позже.',
    )
  })

  it('normalizes client-side failures', () => {
    expect(errorText(new NetworkError(new Error('offline')))).toBe(
      'Сервер не отвечает. Проверьте соединение.',
    )
    expect(errorText(new ContractError('/tracks', new Error('invalid')))).toBe(
      'Сервер вернул неожиданный ответ.',
    )
  })
})

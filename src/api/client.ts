import type { z } from 'zod'

import { translate } from '@/i18n'

import { camelizeKeys } from './case'
import { ApiError, ContractError, NetworkError, toApiError } from './errors'
import { accessTokenSchema } from './schemas/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const DEFAULT_TIMEOUT_MS = 15_000

interface Session {
  token: string
  expiresAt: number
}

/** Access-токен живёт только в памяти вкладки: в localStorage его достанет любой XSS,
    а refresh лежит в httpOnly-куке и переживает перезагрузку сам. */
let session: Session | null = null
let refreshInFlight: Promise<Session | null> | null = null

/* Сервер отверг refresh-куку (вышли в другой вкладке, «завершить все сеансы»,
   истёк срок): без сигнала наружу интерфейс продолжал бы показывать «вы вошли»,
   а каждый запрос падал бы с 401. Сетевой сбой сюда не относится — это не выход. */
const sessionLostListeners = new Set<() => void>()

export function onSessionLost(listener: () => void): () => void {
  sessionLostListeners.add(listener)
  return () => sessionLostListeners.delete(listener)
}

const EXPIRY_SKEW_MS = 30_000

export function clearSession(): void {
  session = null
}

/** Вход по почте отдаёт access-токен прямо в теле ответа, без похода на /auth/refresh. */
export function setSession(accessToken: string, expiresAt: string): void {
  session = { token: accessToken, expiresAt: new Date(expiresAt).getTime() }
}

function isExpired(value: Session): boolean {
  return value.expiresAt - EXPIRY_SKEW_MS <= Date.now()
}

/** Обновление access-токена по refresh-куке. Параллельные вызовы делят один запрос:
    иначе десять 401 подряд отправили бы десять ротаций refresh-токена. */
export function refreshSession(): Promise<Session | null> {
  refreshInFlight ??= (async (): Promise<Session | null> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        const hadSession = session !== null
        session = null
        if (hadSession && (response.status === 401 || response.status === 403)) {
          for (const listener of sessionLostListeners) listener()
        }
        return null
      }
      const parsed = accessTokenSchema.parse(camelizeKeys(await response.json()))
      session = {
        token: parsed.accessToken,
        expiresAt: new Date(parsed.expiresAt).getTime(),
      }
      return session
    } catch {
      session = null
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

interface RequestOptions<T extends z.ZodType> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  rawBody?: { data: BodyInit; contentType: string }
  formData?: FormData
  query?: Record<string, string | number | boolean | readonly string[] | undefined>
  schema?: T
  withCookies?: boolean
  skipRetry?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query: RequestOptions<z.ZodType>['query']): string {
  const url = `${BASE_URL}${path}`
  if (!query) {
    return url
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      // Мультизначения (?status=a&status=b) FastAPI собирает в list[...].
      for (const item of value) params.append(key, item)
    } else if (value !== undefined) {
      params.set(key, String(value))
    }
  }
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

async function send(path: string, options: RequestOptions<z.ZodType>): Promise<Response> {
  const headers = new Headers()
  if (options.rawBody) {
    headers.set('Content-Type', options.rawBody.contentType)
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  // Content-Type для FormData ставит сам fetch — в нём boundary, который нельзя задать вручную.
  if (session && !isExpired(session)) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.withCookies === true ? { credentials: 'include' as const } : {}),
    ...(options.formData
      ? { body: options.formData }
      : options.rawBody
        ? { body: options.rawBody.data }
        : options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
  }

  try {
    return await fetch(buildUrl(path, options.query), init)
  } catch (cause) {
    throw new NetworkError(cause)
  }
}

/** Без явного signal вешает свой таймаут: иначе недоступный бэкенд оставляет
    запрос висеть вечно и LoadState — с ним — в состоянии «загрузка» навсегда.
    Стриминг (requestStream) сюда не заходит и таймаутом не ограничен. */
function withTimeout(
  signal: AbortSignal | undefined,
  ms: number,
): { signal: AbortSignal; clear: () => void } {
  if (signal) {
    return { signal, clear: () => {} }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, ms)
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer)
    },
  }
}

export async function request<T extends z.ZodType>(
  path: string,
  options: RequestOptions<T> & { schema: T },
): Promise<z.infer<T>>
export async function request(path: string, options?: RequestOptions<z.ZodType>): Promise<void>
export async function request<T extends z.ZodType>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<z.infer<T> | void> {
  if (session && isExpired(session) && options.withCookies !== true) {
    await refreshSession()
  }

  const timeout = withTimeout(options.signal, DEFAULT_TIMEOUT_MS)
  try {
    let response = await send(path, { ...options, signal: timeout.signal })

    if (response.status === 401 && options.skipRetry !== true && options.withCookies !== true) {
      const renewed = await refreshSession()
      if (renewed) {
        response = await send(path, { ...options, signal: timeout.signal })
      }
    }

    if (!response.ok) {
      throw await toApiError(response)
    }

    if (!options.schema || response.status === 204) {
      return
    }

    const payload: unknown = camelizeKeys(await response.json())
    const parsed = options.schema.safeParse(payload)
    if (!parsed.success) {
      throw new ContractError(path, parsed.error)
    }
    return parsed.data
  } finally {
    timeout.clear()
  }
}

interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

/** Собирает все страницы в один массив — для мест, которым нужен весь каталог целиком,
    а не постраничная навигация (серверная пагинация тут — деталь транспорта, не UX). */
export async function fetchAllPages<T>(
  path: string,
  schema: z.ZodType<Page<T>>,
  pageSize = 50,
): Promise<T[]> {
  const items: T[] = []
  let offset = 0
  for (;;) {
    const page = await request(path, { schema, query: { limit: pageSize, offset } })
    items.push(...page.items)
    offset += page.items.length
    if (page.items.length === 0 || offset >= page.total) {
      break
    }
  }
  return items
}

export async function requestStream(
  path: string,
  options: Omit<RequestOptions<z.ZodType>, 'schema'>,
): Promise<ReadableStream<Uint8Array>> {
  if (session && isExpired(session)) {
    await refreshSession()
  }

  let response = await send(path, options)
  if (response.status === 401 && options.skipRetry !== true) {
    const renewed = await refreshSession()
    if (renewed) {
      response = await send(path, options)
    }
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  if (!response.body) {
    throw new NetworkError(new Error(translate('errors.streamNotOpened')))
  }
  return response.body
}

export { ApiError, ContractError, NetworkError }

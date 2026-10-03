import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearSession, onSessionLost, refreshSession, setSession } from '@/api/client'

afterEach(() => {
  vi.unstubAllGlobals()
  clearSession()
})

/** Сессия с уже истёкшим access-токеном — следующий запрос пойдёт в refresh. */
function expiredSession(): void {
  setSession('stale-token', new Date(Date.now() - 60_000).toISOString())
}

describe('refreshSession', () => {
  it('сообщает о потере сессии, когда сервер отверг refresh-куку', async () => {
    expiredSession()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    const lost = vi.fn()
    const unsubscribe = onSessionLost(lost)

    expect(await refreshSession()).toBeNull()
    expect(lost).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('сетевой сбой — не выход из аккаунта', async () => {
    expiredSession()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const lost = vi.fn()
    const unsubscribe = onSessionLost(lost)

    expect(await refreshSession()).toBeNull()
    expect(lost).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('гость без сессии при старте не считается «вылетевшим»', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    const lost = vi.fn()
    const unsubscribe = onSessionLost(lost)

    await refreshSession()
    expect(lost).not.toHaveBeenCalled()
    unsubscribe()
  })
})

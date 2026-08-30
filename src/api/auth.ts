import { clearSession, refreshSession, request } from './client'
import { authorizeUrlSchema, meSchema } from './schemas/auth'
import type { Me } from './schemas/auth'

export function githubLoginUrl(nextPath: string): Promise<{ authorizeUrl: string }> {
  return request('/auth/github/login', {
    query: { next_path: nextPath },
    schema: authorizeUrlSchema,
  })
}

export function githubLinkUrl(nextPath: string): Promise<{ authorizeUrl: string }> {
  return request('/auth/github/link', {
    query: { next_path: nextPath },
    schema: authorizeUrlSchema,
  })
}

export function fetchMe(): Promise<Me> {
  return request('/auth/me', { schema: meSchema })
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST', withCookies: true })
  clearSession()
}

export async function logoutEverywhere(): Promise<void> {
  await request('/auth/logout/all', { method: 'POST' })
  clearSession()
}

export async function unlinkIdentity(provider: 'github'): Promise<void> {
  await request(`/auth/identities/${provider}`, { method: 'DELETE' })
}

export async function restoreSession(): Promise<Me | null> {
  const renewed = await refreshSession()
  if (!renewed) {
    return null
  }
  return fetchMe()
}

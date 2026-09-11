import { clearSession, refreshSession, request, setSession } from './client'
import {
  accessTokenSchema,
  authorizeUrlSchema,
  mcpAuthorizationApprovalSchema,
  mcpAuthorizationRequestSchema,
  meSchema,
  providersSchema,
} from './schemas/auth'
import type { McpAuthorizationRequest, Me } from './schemas/auth'
import type { IdentityProvider } from './schemas/common'
import type { DeveloperGrade, Specialty } from './schemas/users'
import { snakeBody } from './case'

/** Какие способы входа реально настроены на сервере: ключей может не быть. */
export function listProviders(): Promise<{ providers: IdentityProvider[] }> {
  return request('/auth/providers', { schema: providersSchema })
}

export function loginUrl(
  provider: IdentityProvider,
  nextPath: string,
): Promise<{ authorizeUrl: string }> {
  return request(`/auth/${provider}/login`, {
    query: { next_path: nextPath },
    schema: authorizeUrlSchema,
  })
}

export function linkUrl(
  provider: IdentityProvider,
  nextPath: string,
): Promise<{ authorizeUrl: string }> {
  return request(`/auth/${provider}/link`, {
    query: { next_path: nextPath },
    schema: authorizeUrlSchema,
  })
}

export function fetchMe(): Promise<Me> {
  return request('/auth/me', { schema: meSchema })
}

export async function requestEmailLoginCode(email: string): Promise<void> {
  await request('/auth/email/start', { method: 'POST', body: snakeBody({ email }) })
}

/** Код подтверждает почту, дальше сервер сам решает: вход или регистрация нового пользователя. */
export async function verifyEmailLoginCode(email: string, code: string): Promise<Me> {
  const tokens = await request('/auth/email/verify', {
    method: 'POST',
    body: snakeBody({ email, code }),
    schema: accessTokenSchema,
    withCookies: true,
  })
  setSession(tokens.accessToken, tokens.expiresAt)
  return fetchMe()
}

export async function requestEmailLinkCode(email: string): Promise<void> {
  await request('/auth/email/link/start', { method: 'POST', body: snakeBody({ email }) })
}

export async function verifyEmailLinkCode(email: string, code: string): Promise<void> {
  await request('/auth/email/link/verify', { method: 'POST', body: snakeBody({ email, code }) })
}

export interface ProfileChanges {
  name?: string | null
  headline?: string | null
  bio?: string | null
  specialty?: Specialty | null
  grade?: DeveloperGrade | null
  experienceYears?: number | null
}

export function updateProfile(changes: ProfileChanges): Promise<Me> {
  return request('/auth/me', {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: meSchema,
  })
}

export function getMcpAuthorizationRequest(requestId: string): Promise<McpAuthorizationRequest> {
  return request(`/oauth/requests/${encodeURIComponent(requestId)}`, {
    schema: mcpAuthorizationRequestSchema,
  })
}

export function approveMcpAuthorization(requestId: string): Promise<{ redirectUrl: string }> {
  return request(`/oauth/requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST',
    schema: mcpAuthorizationApprovalSchema,
  })
}

export function denyMcpAuthorization(requestId: string): Promise<{ redirectUrl: string }> {
  return request(`/oauth/requests/${encodeURIComponent(requestId)}/deny`, {
    method: 'POST',
    schema: mcpAuthorizationApprovalSchema,
  })
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST', withCookies: true })
  clearSession()
}

export async function logoutEverywhere(): Promise<void> {
  await request('/auth/logout/all', { method: 'POST' })
  clearSession()
}

export async function unlinkIdentity(provider: IdentityProvider): Promise<void> {
  await request(`/auth/identities/${provider}`, { method: 'DELETE' })
}

export async function restoreSession(): Promise<Me | null> {
  const renewed = await refreshSession()
  if (!renewed) {
    return null
  }
  return fetchMe()
}

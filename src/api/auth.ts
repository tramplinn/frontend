import { clearSession, refreshSession, request } from './client'
import {
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
  return request(`/auth/mcp/requests/${encodeURIComponent(requestId)}`, {
    schema: mcpAuthorizationRequestSchema,
  })
}

export function approveMcpAuthorization(requestId: string): Promise<{ redirectUrl: string }> {
  return request(`/auth/mcp/requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST',
    schema: mcpAuthorizationApprovalSchema,
  })
}

export function denyMcpAuthorization(requestId: string): Promise<{ redirectUrl: string }> {
  return request(`/auth/mcp/requests/${encodeURIComponent(requestId)}/deny`, {
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

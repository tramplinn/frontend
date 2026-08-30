import { z } from 'zod'

import { request } from './client'
import { assetPageSchema, studentGroupSchema, userPageSchema } from './schemas/admin'
import type { AssetPage, StudentGroup, UserPage } from './schemas/admin'
import type { User } from './schemas/auth'
import { userSchema } from './schemas/auth'
import type { UserRole } from './schemas/common'

export interface UserFilters {
  q?: string
  role?: UserRole
  groupId?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export function listUsers(filters: UserFilters = {}): Promise<UserPage> {
  return request('/admin/users', {
    schema: userPageSchema,
    query: {
      q: filters.q,
      role: filters.role,
      group_id: filters.groupId,
      is_active: filters.isActive,
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
    },
  })
}

export interface UserChanges {
  name?: string | null
  studentNumber?: string | null
  groupId?: string | null
  role?: UserRole
  isActive?: boolean
}

export function updateUser(userId: string, changes: UserChanges): Promise<User> {
  return request(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: {
      ...(changes.name === undefined ? {} : { name: changes.name }),
      ...(changes.studentNumber === undefined ? {} : { student_number: changes.studentNumber }),
      ...(changes.groupId === undefined ? {} : { group_id: changes.groupId }),
      ...(changes.role === undefined ? {} : { role: changes.role }),
      ...(changes.isActive === undefined ? {} : { is_active: changes.isActive }),
    },
    schema: userSchema,
  })
}

export function listGroups(): Promise<StudentGroup[]> {
  return request('/admin/groups', { schema: z.array(studentGroupSchema) })
}

export function createGroup(name: string, year: number): Promise<StudentGroup> {
  return request('/admin/groups', {
    method: 'POST',
    body: { name, year },
    schema: studentGroupSchema,
  })
}

export function updateGroup(
  groupId: string,
  changes: { name?: string; year?: number },
): Promise<StudentGroup> {
  return request(`/admin/groups/${groupId}`, {
    method: 'PATCH',
    body: changes,
    schema: studentGroupSchema,
  })
}

export async function deleteGroup(groupId: string): Promise<void> {
  await request(`/admin/groups/${groupId}`, { method: 'DELETE' })
}

export function listAssets(query?: string, limit = 50, offset = 0): Promise<AssetPage> {
  return request('/assets', {
    schema: assetPageSchema,
    query: { q: query, limit, offset },
  })
}

export { uploadAsset } from './assets'

export async function deleteAsset(assetId: string): Promise<void> {
  await request(`/assets/${assetId}`, { method: 'DELETE' })
}

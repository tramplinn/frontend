import { request } from './client'
import { userPageSchema } from './schemas/admin'
import type { UserPage } from './schemas/admin'
import type { User } from './schemas/auth'
import { userSchema } from './schemas/auth'
import type { UserRole } from './schemas/common'

export interface UserFilters {
  q?: string
  role?: UserRole
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
      is_active: filters.isActive,
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
    },
  })
}

export interface UserChanges {
  name?: string | null
  studentNumber?: string | null
  role?: UserRole
  isActive?: boolean
}

export function updateUser(userId: string, changes: UserChanges): Promise<User> {
  return request(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: {
      ...(changes.name === undefined ? {} : { name: changes.name }),
      ...(changes.studentNumber === undefined ? {} : { student_number: changes.studentNumber }),
      ...(changes.role === undefined ? {} : { role: changes.role }),
      ...(changes.isActive === undefined ? {} : { is_active: changes.isActive }),
    },
    schema: userSchema,
  })
}

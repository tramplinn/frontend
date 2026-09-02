import { z } from 'zod'

import { dateTimeSchema, identityProviderSchema, userRoleSchema, uuidSchema } from './common'

export const authorizeUrlSchema = z.object({
  authorizeUrl: z.url(),
})

export const providersSchema = z.object({
  providers: z.array(identityProviderSchema).default([]),
})

export const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string().default('Bearer'),
  expiresAt: dateTimeSchema,
})

export const identitySchema = z.object({
  provider: identityProviderSchema,
  providerId: z.string(),
  email: z.string().nullable(),
  createdAt: dateTimeSchema,
})

export const userSchema = z.object({
  id: uuidSchema,
  login: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  studentNumber: z.string().nullable(),
  role: userRoleSchema,
  isActive: z.boolean(),
})

export const meSchema = userSchema.extend({
  identities: z.array(identitySchema).default([]),
})

export type AuthorizeUrl = z.infer<typeof authorizeUrlSchema>
export type AccessToken = z.infer<typeof accessTokenSchema>
export type Identity = z.infer<typeof identitySchema>
export type User = z.infer<typeof userSchema>
export type Me = z.infer<typeof meSchema>

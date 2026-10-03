import { z } from 'zod'

import { dateTimeSchema, pageSchema, uuidSchema } from './common'

export const projectStatusSchema = z.enum([
  'idea',
  'planning',
  'in_progress',
  'paused',
  'done',
  'archived',
])
export const projectVisibilitySchema = z.enum(['public', 'authenticated', 'private'])
export const projectRoleSchema = z.enum(['owner', 'maintainer', 'contributor', 'viewer'])
export const projectInviteStatusSchema = z.enum([
  'pending',
  'accepted',
  'declined',
  'revoked',
  'expired',
])
export const projectLinkKindSchema = z.enum([
  'repository',
  'demo',
  'docs',
  'design',
  'video',
  'presentation',
  'other',
])
export const profileBlockSchema = z.enum(['about', 'projects', 'stats', 'courses', 'resume'])
export const projectSortSchema = z.enum(['updated', 'created', 'status_changed', 'title'])

export const projectLinkSchema = z.object({
  id: uuidSchema,
  kind: projectLinkKindSchema,
  url: z.string(),
  label: z.string().nullable(),
  position: z.number().int(),
})

export const projectMemberSchema = z.object({
  userId: uuidSchema,
  login: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: projectRoleSchema,
  title: z.string().nullable(),
  joinedAt: dateTimeSchema,
})

export const projectCardSchema = z.object({
  id: uuidSchema,
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  status: projectStatusSchema,
  visibility: projectVisibilitySchema,
  logoUrl: z.string().nullable(),
  membersCount: z.number().int(),
  myRole: projectRoleSchema.nullable(),
  memberTitle: z.string().nullable(),
  showInProfile: z.boolean().nullable(),
  updatedAt: dateTimeSchema,
})

export const projectSchema = projectCardSchema.extend({
  readmeMd: z.string(),
  logoAssetId: uuidSchema.nullable(),
  links: z.array(projectLinkSchema),
  members: z.array(projectMemberSchema),
  statusChangedAt: dateTimeSchema,
  createdAt: dateTimeSchema,
})

export const projectStatusEventSchema = z.object({
  id: uuidSchema,
  fromStatus: projectStatusSchema.nullable(),
  toStatus: projectStatusSchema,
  actorLogin: z.string().nullable(),
  createdAt: dateTimeSchema,
})

export const projectInviteSchema = z.object({
  id: uuidSchema,
  project: z.object({
    slug: z.string(),
    title: z.string(),
    logoUrl: z.string().nullable(),
  }),
  inviteeLogin: z.string(),
  inviterLogin: z.string().nullable(),
  role: projectRoleSchema,
  title: z.string().nullable(),
  status: projectInviteStatusSchema,
  expiresAt: dateTimeSchema,
  createdAt: dateTimeSchema,
})

export const profileLayoutItemSchema = z.object({
  block: profileBlockSchema,
  visible: z.boolean(),
})

export const profileLayoutSchema = z.object({ blocks: z.array(profileLayoutItemSchema) })

export const projectCardPageSchema = pageSchema(projectCardSchema)
export const projectCardListSchema = z.array(projectCardSchema)
export const projectMemberListSchema = z.array(projectMemberSchema)
export const projectStatusEventListSchema = z.array(projectStatusEventSchema)
export const projectInviteListSchema = z.array(projectInviteSchema)

export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type ProjectVisibility = z.infer<typeof projectVisibilitySchema>
export type ProjectRole = z.infer<typeof projectRoleSchema>
export type ProjectLinkKind = z.infer<typeof projectLinkKindSchema>
export type ProjectSort = z.infer<typeof projectSortSchema>
export type ProfileBlock = z.infer<typeof profileBlockSchema>
export type ProjectLink = z.infer<typeof projectLinkSchema>
export type ProjectMember = z.infer<typeof projectMemberSchema>
export type ProjectCard = z.infer<typeof projectCardSchema>
export type Project = z.infer<typeof projectSchema>
export type ProjectStatusEvent = z.infer<typeof projectStatusEventSchema>
export type ProjectInvite = z.infer<typeof projectInviteSchema>
export type ProfileLayoutItem = z.infer<typeof profileLayoutItemSchema>
export type ProjectCardPage = z.infer<typeof projectCardPageSchema>

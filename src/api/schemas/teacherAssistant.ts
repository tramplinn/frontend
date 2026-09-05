import { z } from 'zod'

import { algorithmDifficultySchema } from './algorithms'

export const teacherAssistantPatchSchema = z.object({
  explanation: z.string(),
  title: z.string().nullable(),
  bodyMd: z.string().nullable(),
  statementMd: z.string().nullable(),
  difficulty: algorithmDifficultySchema.nullable(),
  topics: z.array(z.string()).nullable(),
  timeLimitMs: z.number().int().nullable(),
  memoryLimitKb: z.number().int().nullable(),
})

export type TeacherAssistantPatch = z.infer<typeof teacherAssistantPatchSchema>

export interface TeacherAssistantDocument {
  title: string
  bodyMd?: string
  statementMd?: string
  difficulty?: z.infer<typeof algorithmDifficultySchema>
  topics?: string[]
  timeLimitMs?: number
  memoryLimitKb?: number
}

export type TeacherAssistantSurface = 'lesson' | 'algorithm_problem'

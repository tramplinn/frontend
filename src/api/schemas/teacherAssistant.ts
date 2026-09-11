import { z } from 'zod'

import { algorithmLanguageSchema } from './algorithmAuthoring'
import { algorithmDifficultySchema } from './algorithms'

export const teacherAssistantTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isSample: z.boolean(),
})

export type TeacherAssistantTestCase = z.infer<typeof teacherAssistantTestCaseSchema>

export const teacherAssistantTemplateSchema = z.object({
  language: algorithmLanguageSchema,
  starterCode: z.string(),
  solutionCode: z.string(),
})

export type TeacherAssistantTemplate = z.infer<typeof teacherAssistantTemplateSchema>

export const teacherAssistantPatchSchema = z.object({
  explanation: z.string(),
  title: z.string().nullable(),
  bodyMd: z.string().nullable(),
  statementMd: z.string().nullable(),
  difficulty: algorithmDifficultySchema.nullable(),
  tags: z.array(z.string()).nullable(),
  timeLimitMs: z.number().int().nullable(),
  memoryLimitKb: z.number().int().nullable(),
  testCases: z.array(teacherAssistantTestCaseSchema).nullable(),
  templates: z.array(teacherAssistantTemplateSchema).nullable(),
})

export type TeacherAssistantPatch = z.infer<typeof teacherAssistantPatchSchema>

export interface TeacherAssistantDocument {
  title: string
  bodyMd?: string
  statementMd?: string
  difficulty?: z.infer<typeof algorithmDifficultySchema>
  tags?: string[]
  timeLimitMs?: number
  memoryLimitKb?: number
  testCases?: TeacherAssistantTestCase[]
  templates?: TeacherAssistantTemplate[]
}

export type TeacherAssistantSurface = 'lesson' | 'algorithm_problem'

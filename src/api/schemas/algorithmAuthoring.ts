import { z } from 'zod'

import { algorithmDifficultySchema, practiceModeSchema } from './algorithms'
import { contentStatusSchema, uuidSchema } from './common'
import { tagSchema } from './tags'

/** Языки, которые принимает бэкенд (LANGUAGE_PATTERN в schemas/algorithms.py). */
export const algorithmLanguageSchema = z.enum([
  'python',
  'javascript',
  'typescript',
  'cpp',
  'java',
  'csharp',
  'go',
  'kotlin',
])

export const algorithmProviderSchema = z.enum(['internal', 'leetcode', 'codeforces', 'external'])

export const testCaseSchema = z.object({
  id: uuidSchema,
  position: z.number().int(),
  input: z.string(),
  expectedOutput: z.string(),
  isSample: z.boolean(),
  weight: z.number().int(),
})

export const templateAuthorSchema = z.object({
  language: z.string(),
  starterCode: z.string(),
  solutionCode: z.string(),
  validatedAt: z.string().nullable(),
})

export const problemAuthorSchema = z.object({
  id: uuidSchema,
  provider: algorithmProviderSchema,
  externalKey: z.string().nullable(),
  externalUrl: z.string().nullable(),
  title: z.string(),
  statementMd: z.string(),
  statementHtml: z.string(),
  difficulty: algorithmDifficultySchema,
  tags: z.array(tagSchema),
  timeLimitMs: z.number().int(),
  memoryLimitKb: z.number().int(),
  status: contentStatusSchema,
  testCases: z.array(testCaseSchema),
  templates: z.array(templateAuthorSchema),
})

export const setProblemAuthorSchema = z.object({
  problemId: uuidSchema,
  position: z.number().int(),
  recommendedMinutes: z.number().int().nullable(),
  title: z.string(),
  difficulty: algorithmDifficultySchema,
  solved: z.boolean().default(false),
})

export const practiceSetAuthorSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string(),
  mode: practiceModeSchema,
  durationMinutes: z.number().int().nullable(),
  status: contentStatusSchema,
  problems: z.array(setProblemAuthorSchema),
})

export type AlgorithmLanguage = z.infer<typeof algorithmLanguageSchema>
export type AlgorithmProvider = z.infer<typeof algorithmProviderSchema>
export type TestCase = z.infer<typeof testCaseSchema>
export type TemplateAuthor = z.infer<typeof templateAuthorSchema>
export type ProblemAuthor = z.infer<typeof problemAuthorSchema>
export type PracticeSetAuthor = z.infer<typeof practiceSetAuthorSchema>
export type SetProblemAuthor = z.infer<typeof setProblemAuthorSchema>

import { z } from 'zod'

import { contentStatusSchema, uuidSchema } from './common'
import { tagSchema } from './tags'

export const algorithmDifficultySchema = z.enum(['easy', 'medium', 'hard'])
export const practiceModeSchema = z.enum(['practice', 'mock_interview'])
export const sessionStatusSchema = z.enum(['active', 'completed', 'expired'])
export const submissionStatusSchema = z.enum(['queued', 'running', 'finished', 'failed'])
export const verdictSchema = z.enum([
  'accepted',
  'wrong_answer',
  'compile_error',
  'runtime_error',
  'time_limit',
  'memory_limit',
  'output_limit',
  'internal_error',
])

export const setProblemSchema = z.object({
  problemId: uuidSchema,
  position: z.number().int(),
  recommendedMinutes: z.number().int().nullable(),
  title: z.string(),
  difficulty: algorithmDifficultySchema,
  solved: z.boolean().default(false),
})

export const practiceSetSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string(),
  mode: practiceModeSchema,
  durationMinutes: z.number().int().nullable(),
  status: contentStatusSchema,
  problems: z.array(setProblemSchema),
})

export const practiceSessionSchema = z.object({
  id: uuidSchema,
  practiceSetId: uuidSchema.nullable(),
  mode: practiceModeSchema,
  status: sessionStatusSchema,
  startedAt: z.string(),
  deadlineAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  reflectionMd: z.string().nullable(),
})

export const sampleCaseSchema = z.object({
  position: z.number().int(),
  input: z.string(),
  expectedOutput: z.string(),
})

export const algorithmTemplateSchema = z.object({
  language: z.string(),
  starterCode: z.string(),
})

export const algorithmProblemSchema = z.object({
  id: uuidSchema,
  provider: z.enum(['internal', 'leetcode', 'codeforces', 'external']),
  externalKey: z.string().nullable(),
  externalUrl: z.string().nullable(),
  title: z.string(),
  statementHtml: z.string(),
  difficulty: algorithmDifficultySchema,
  tags: z.array(tagSchema),
  timeLimitMs: z.number().int(),
  memoryLimitKb: z.number().int(),
  samples: z.array(sampleCaseSchema),
  templates: z.array(algorithmTemplateSchema),
})

export const runCaseSchema = z.object({
  position: z.number().int().nullable(),
  verdict: verdictSchema,
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compileOutput: z.string().nullable().default(null),
  message: z.string().nullable().default(null),
  runtimeMs: z.number().int().nullable(),
  memoryKb: z.number().int().nullable(),
})

export const failedCaseSchema = z.object({
  position: z.number().int().nullable(),
  input: z.string().nullable(),
  expectedOutput: z.string().nullable(),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compileOutput: z.string().nullable(),
  message: z.string().nullable(),
  runtimeMs: z.number().int().nullable(),
  memoryKb: z.number().int().nullable(),
})

export const submissionSchema = z.object({
  id: uuidSchema,
  sessionId: uuidSchema,
  problemId: uuidSchema,
  kind: z.enum(['run', 'submit']),
  language: z.string(),
  status: submissionStatusSchema,
  verdict: verdictSchema.nullable(),
  runtimeMs: z.number().int().nullable(),
  memoryKb: z.number().int().nullable(),
  failedTest: z.number().int().nullable(),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  safeError: z.string().nullable(),
  cases: z.array(runCaseSchema),
  failedCase: failedCaseSchema.nullable().default(null),
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
})

export const runnerLanguageSchema = z.object({ key: z.string(), name: z.string() })

export const progressStatusSchema = z.enum(['unseen', 'attempted', 'solved', 'review'])

export const problemCardSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  difficulty: algorithmDifficultySchema,
  tags: z.array(tagSchema),
  provider: z.enum(['internal', 'leetcode', 'codeforces', 'external']),
  externalUrl: z.string().nullable(),
  languages: z.array(z.string()),
  status: progressStatusSchema,
  attempts: z.number().int(),
  solved: z.boolean(),
})

export const problemCatalogSchema = z.object({
  items: z.array(problemCardSchema),
  tags: z.array(tagSchema),
  total: z.number().int(),
})

export const algorithmProgressSchema = z.object({
  problemId: uuidSchema,
  status: progressStatusSchema,
  attempts: z.number().int(),
  hintsUsed: z.number().int(),
  firstSolvedAt: z.string().nullable(),
  lastAttemptAt: z.string().nullable(),
  complexityMd: z.string().nullable(),
  confidence: z.number().int().nullable(),
  reflectionMd: z.string().nullable(),
  lastSolutionLanguage: z.string().nullable(),
  lastSolutionCode: z.string().nullable(),
})

export const solutionSchema = z.object({
  id: uuidSchema,
  language: z.string(),
  sourceCode: z.string(),
  finishedAt: z.string().nullable(),
})

export type PracticeSet = z.infer<typeof practiceSetSchema>
export type PracticeSession = z.infer<typeof practiceSessionSchema>
export type AlgorithmProblem = z.infer<typeof algorithmProblemSchema>
export type AlgorithmSubmission = z.infer<typeof submissionSchema>
export type FailedCase = z.infer<typeof failedCaseSchema>
export type RunnerLanguage = z.infer<typeof runnerLanguageSchema>
export type AlgorithmDifficulty = z.infer<typeof algorithmDifficultySchema>
export type ProblemCard = z.infer<typeof problemCardSchema>
export type ProblemCatalog = z.infer<typeof problemCatalogSchema>
export type AlgorithmProgress = z.infer<typeof algorithmProgressSchema>
export type AlgorithmSolution = z.infer<typeof solutionSchema>
export type AlgorithmVerdict = z.infer<typeof verdictSchema>

import { snakeBody } from './case'
import { fetchAllPages, request } from './client'
import {
  practiceSetAuthorPageSchema,
  practiceSetAuthorSchema,
  problemAuthorPageSchema,
  problemAuthorSchema,
  templateAuthorSchema,
  testCaseSchema,
} from './schemas/algorithmAuthoring'
import type {
  AlgorithmLanguage,
  PracticeSetAuthor,
  ProblemAuthor,
  TemplateAuthor,
  TestCase,
} from './schemas/algorithmAuthoring'
import type { AlgorithmDifficulty } from './schemas/algorithms'
import type { ContentStatus } from './schemas/common'

const BASE = '/authoring'

export interface ProblemDraft {
  title: string
  difficulty: AlgorithmDifficulty
  statementMd?: string
  tags?: string[]
  timeLimitMs?: number
  memoryLimitKb?: number
  status?: ContentStatus
}

export function listProblems(): Promise<ProblemAuthor[]> {
  return fetchAllPages(`${BASE}/algorithms/problems`, problemAuthorPageSchema)
}

export function getProblem(problemId: string): Promise<ProblemAuthor> {
  return request(`${BASE}/algorithms/problems/${problemId}`, { schema: problemAuthorSchema })
}

export function createProblem(draft: ProblemDraft): Promise<ProblemAuthor> {
  return request(`${BASE}/algorithms/problems`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: problemAuthorSchema,
  })
}

export function updateProblem(
  problemId: string,
  changes: Partial<ProblemDraft>,
): Promise<ProblemAuthor> {
  return request(`${BASE}/algorithms/problems/${problemId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: problemAuthorSchema,
  })
}

export async function deleteProblem(problemId: string): Promise<void> {
  await request(`${BASE}/algorithms/problems/${problemId}`, { method: 'DELETE' })
}

export interface TestCaseDraft {
  position: number
  input?: string
  expectedOutput: string
  isSample?: boolean
  weight?: number
}

export function addTestCase(problemId: string, draft: TestCaseDraft): Promise<TestCase> {
  return request(`${BASE}/algorithms/problems/${problemId}/test-cases`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: testCaseSchema,
  })
}

export function updateTestCase(caseId: string, changes: Partial<TestCaseDraft>): Promise<TestCase> {
  return request(`${BASE}/algorithms/test-cases/${caseId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: testCaseSchema,
  })
}

export async function deleteTestCase(caseId: string): Promise<void> {
  await request(`${BASE}/algorithms/test-cases/${caseId}`, { method: 'DELETE' })
}

export function putTemplate(
  problemId: string,
  language: AlgorithmLanguage,
  starterCode: string,
  solutionCode: string,
): Promise<TemplateAuthor> {
  return request(`${BASE}/algorithms/problems/${problemId}/templates/${language}`, {
    method: 'PUT',
    body: snakeBody({ language, starterCode, solutionCode }),
    schema: templateAuthorSchema,
  })
}

/** Прогоняет эталонное решение по всем тестам задачи и проставляет validatedAt. */
export function validateTemplate(
  problemId: string,
  language: AlgorithmLanguage,
): Promise<TemplateAuthor> {
  return request(`${BASE}/algorithms/problems/${problemId}/templates/${language}/validate`, {
    method: 'POST',
    body: {},
    schema: templateAuthorSchema,
  })
}

export async function deleteTemplate(
  problemId: string,
  language: AlgorithmLanguage,
): Promise<void> {
  await request(`${BASE}/algorithms/problems/${problemId}/templates/${language}`, {
    method: 'DELETE',
  })
}

export interface PracticeSetDraft {
  title: string
  description?: string
  mode?: 'practice' | 'mock_interview'
  durationMinutes?: number | null
  status?: ContentStatus
}

export function listPracticeSets(): Promise<PracticeSetAuthor[]> {
  return fetchAllPages(`${BASE}/practice-sets`, practiceSetAuthorPageSchema)
}

export function getPracticeSet(setId: string): Promise<PracticeSetAuthor> {
  return request(`${BASE}/practice-sets/${setId}`, { schema: practiceSetAuthorSchema })
}

export function createPracticeSet(
  moduleId: string,
  draft: PracticeSetDraft,
): Promise<PracticeSetAuthor> {
  return request(`${BASE}/modules/${moduleId}/practice-sets`, {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: practiceSetAuthorSchema,
  })
}

export function updatePracticeSet(
  setId: string,
  changes: Partial<PracticeSetDraft>,
): Promise<PracticeSetAuthor> {
  return request(`${BASE}/practice-sets/${setId}`, {
    method: 'PATCH',
    body: snakeBody({ ...changes }),
    schema: practiceSetAuthorSchema,
  })
}

export async function deletePracticeSet(setId: string): Promise<void> {
  await request(`${BASE}/practice-sets/${setId}`, { method: 'DELETE' })
}

export function addSetProblem(
  setId: string,
  problemId: string,
  recommendedMinutes: number | null,
): Promise<PracticeSetAuthor> {
  return request(`${BASE}/practice-sets/${setId}/problems`, {
    method: 'POST',
    body: snakeBody({ problemId, recommendedMinutes }),
    schema: practiceSetAuthorSchema,
  })
}

export async function reorderSetProblems(setId: string, problemIds: string[]): Promise<void> {
  await request(`${BASE}/practice-sets/${setId}/problems/order`, {
    method: 'PUT',
    body: { problem_ids: problemIds },
  })
}

export async function removeSetProblem(setId: string, problemId: string): Promise<void> {
  await request(`${BASE}/practice-sets/${setId}/problems/${problemId}`, { method: 'DELETE' })
}

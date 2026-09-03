import { z } from 'zod'

import { snakeBody } from './case'
import { request } from './client'
import {
  algorithmProblemSchema,
  algorithmProgressSchema,
  practiceSessionSchema,
  practiceSetSchema,
  problemCatalogSchema,
  runnerLanguageSchema,
  submissionSchema,
} from './schemas/algorithms'
import type {
  AlgorithmDifficulty,
  AlgorithmProblem,
  AlgorithmProgress,
  AlgorithmSubmission,
  PracticeSession,
  PracticeSet,
  ProblemCatalog,
  RunnerLanguage,
} from './schemas/algorithms'

/* exactOptionalPropertyTypes: undefined в значении разрешаем явно,
   иначе фильтры пришлось бы собирать по одному полю. */
export interface CatalogFilters {
  difficulty?: AlgorithmDifficulty | undefined
  topic?: string | undefined
  query?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

/** Каталог тренажёра: только опубликованные задачи плюс прогресс текущего пользователя. */
export function listCatalog(filters: CatalogFilters = {}): Promise<ProblemCatalog> {
  return request('/algorithm-problems', {
    query: { ...filters },
    schema: problemCatalogSchema,
  })
}

/** Сессия вне набора практики: нужна, чтобы отправлять решения из тренажёра. */
export function startFreeSession(): Promise<PracticeSession> {
  return request('/practice-sessions', {
    method: 'POST',
    body: {},
    schema: practiceSessionSchema,
  })
}

export function getAlgorithmProgress(problemId: string): Promise<AlgorithmProgress> {
  return request(`/algorithm-problems/${problemId}/progress`, {
    schema: algorithmProgressSchema,
  })
}

export interface ReflectionDraft {
  complexityMd: string | null
  confidence: number | null
  reflectionMd: string | null
}

export function saveAlgorithmReflection(
  problemId: string,
  draft: ReflectionDraft,
): Promise<AlgorithmProgress> {
  return request(`/algorithm-problems/${problemId}/reflection`, {
    method: 'PUT',
    body: snakeBody({ ...draft }),
    schema: algorithmProgressSchema,
  })
}

export function getPracticeSet(id: string): Promise<PracticeSet> {
  return request(`/practice-sets/${id}`, { schema: practiceSetSchema })
}

export function startPracticeSession(id: string): Promise<PracticeSession> {
  return request(`/practice-sets/${id}/sessions`, {
    method: 'POST',
    body: {},
    schema: practiceSessionSchema,
  })
}

export function getPracticeSession(id: string): Promise<PracticeSession> {
  return request(`/practice-sessions/${id}`, { schema: practiceSessionSchema })
}

export function completePracticeSession(
  id: string,
  reflectionMd: string | null,
): Promise<PracticeSession> {
  return request(`/practice-sessions/${id}/complete`, {
    method: 'POST',
    body: { reflection_md: reflectionMd },
    schema: practiceSessionSchema,
  })
}

export function getAlgorithmProblem(id: string): Promise<AlgorithmProblem> {
  return request(`/algorithm-problems/${id}`, { schema: algorithmProblemSchema })
}

export function listAlgorithmLanguages(): Promise<RunnerLanguage[]> {
  return request('/algorithm-languages', { schema: z.array(runnerLanguageSchema) })
}

interface SubmitPayload {
  sessionId: string
  language: string
  sourceCode: string
  customInput?: string | null
}

export function runAlgorithm(id: string, payload: SubmitPayload): Promise<AlgorithmSubmission> {
  return request(`/algorithm-problems/${id}/runs`, {
    method: 'POST',
    body: {
      session_id: payload.sessionId,
      language: payload.language,
      source_code: payload.sourceCode,
      custom_input: payload.customInput,
    },
    schema: submissionSchema,
  })
}

export function submitAlgorithm(id: string, payload: SubmitPayload): Promise<AlgorithmSubmission> {
  return request(`/algorithm-problems/${id}/submissions`, {
    method: 'POST',
    body: {
      session_id: payload.sessionId,
      language: payload.language,
      source_code: payload.sourceCode,
    },
    schema: submissionSchema,
  })
}

export function getAlgorithmSubmission(id: string): Promise<AlgorithmSubmission> {
  return request(`/algorithm-submissions/${id}`, { schema: submissionSchema })
}

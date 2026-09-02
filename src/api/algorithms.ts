import { z } from 'zod'

import { request } from './client'
import {
  algorithmProblemSchema,
  practiceSessionSchema,
  practiceSetSchema,
  runnerLanguageSchema,
  submissionSchema,
} from './schemas/algorithms'
import type {
  AlgorithmProblem,
  AlgorithmSubmission,
  PracticeSession,
  PracticeSet,
  RunnerLanguage,
} from './schemas/algorithms'

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

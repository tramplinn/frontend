import { requestStream } from './client'
import { snakeBody } from './case'
import { ContractError } from './errors'
import { tutorEventSchema } from './schemas/tutor'
import type { TutorEvent } from './schemas/tutor'
import { readSseData } from './sse'

export interface TutorTurn {
  role: 'user' | 'assistant'
  content: string
}

async function* askTutorAt(
  path: string,
  messages: TutorTurn[],
  signal?: AbortSignal,
): AsyncGenerator<TutorEvent> {
  const stream = await requestStream(path, {
    method: 'POST',
    body: snakeBody({ messages }),
    withCookies: true,
    ...(signal ? { signal } : {}),
  })

  for await (const data of readSseData(stream)) {
    const parsed = tutorEventSchema.safeParse(JSON.parse(data))
    if (!parsed.success) {
      throw new ContractError(path, parsed.error)
    }
    yield parsed.data
  }
}

export function askTutor(
  lessonId: string,
  messages: TutorTurn[],
  signal?: AbortSignal,
): AsyncGenerator<TutorEvent> {
  return askTutorAt(`/tutor/lessons/${lessonId}/messages`, messages, signal)
}

/** Тот же ассистент, но контекст — условие алгоритмической задачи, а не урок. */
export function askProblemTutor(
  problemId: string,
  messages: TutorTurn[],
  signal?: AbortSignal,
): AsyncGenerator<TutorEvent> {
  return askTutorAt(`/tutor/algorithm-problems/${problemId}/messages`, messages, signal)
}

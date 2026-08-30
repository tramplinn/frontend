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

export async function* askTutor(
  lessonId: string,
  messages: TutorTurn[],
  signal?: AbortSignal,
): AsyncGenerator<TutorEvent> {
  const stream = await requestStream(`/tutor/lessons/${lessonId}/messages`, {
    method: 'POST',
    body: snakeBody({ messages }),
    withCookies: true,
    ...(signal ? { signal } : {}),
  })

  for await (const data of readSseData(stream)) {
    const parsed = tutorEventSchema.safeParse(JSON.parse(data))
    if (!parsed.success) {
      throw new ContractError('/tutor/lessons/{id}/messages', parsed.error)
    }
    yield parsed.data
  }
}

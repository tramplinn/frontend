import { z } from 'zod'

export const tutorEventSchema = z.union([
  z.object({ delta: z.string() }),
  z.object({ done: z.literal(true) }),
  z.object({ error: z.string() }),
])

export type TutorEvent = z.infer<typeof tutorEventSchema>

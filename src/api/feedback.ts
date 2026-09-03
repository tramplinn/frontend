import { snakeBody } from './case'
import { request } from './client'
import { feedbackSchema, type Feedback } from './schemas/feedback'

export interface FeedbackDraft {
  message: string
  pagePath?: string
  attachmentIds?: string[]
}

export function submitFeedback(draft: FeedbackDraft): Promise<Feedback> {
  return request('/feedback', {
    method: 'POST',
    body: snakeBody({ ...draft }),
    schema: feedbackSchema,
  })
}

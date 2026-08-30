import { describe, expect, it } from 'vitest'

import { assetMimeSchema } from '../assets'
import { quizQuestionAuthorSchema, quizQuestionSchema } from '../content'

const id = '01910000-0000-7000-8000-000000000001'

describe('quiz API contracts', () => {
  it('accepts an interactive question with a teacher attachment', () => {
    const result = quizQuestionAuthorSchema.safeParse({
      id,
      position: 1,
      promptMd: 'Соотнесите понятия',
      type: 'matching',
      options: [
        { kind: 'left', id: 'http', label: 'HTTP' },
        { kind: 'right', id: 'protocol', label: 'Протокол' },
      ],
      attachments: [
        {
          id: '01910000-0000-7000-8000-000000000002',
          filename: 'reference.pdf',
          mime: 'application/pdf',
          size: 2048,
          url: 'https://cdn.example.test/reference.pdf',
        },
      ],
      answer: { pairs: { http: 'protocol' } },
      explainMd: null,
    })

    expect(result.success).toBe(true)
  })

  it('rejects an unknown question type and an invalid attachment URL', () => {
    const result = quizQuestionSchema.safeParse({
      id,
      position: 1,
      promptMd: 'Задание',
      type: 'drawing',
      options: [],
      attachments: [
        {
          id,
          filename: 'reference.pdf',
          mime: 'application/pdf',
          size: 1,
          url: 'not-a-url',
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('keeps executable SVG outside the upload whitelist', () => {
    expect(assetMimeSchema.safeParse('image/png').success).toBe(true)
    expect(assetMimeSchema.safeParse('application/pdf').success).toBe(true)
    expect(assetMimeSchema.safeParse('image/svg+xml').success).toBe(false)
  })
})

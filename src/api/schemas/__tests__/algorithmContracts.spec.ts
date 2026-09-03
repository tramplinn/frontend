import { describe, expect, it } from 'vitest'

import { problemAuthorSchema } from '../algorithmAuthoring'
import { practiceSessionSchema, problemCatalogSchema } from '../algorithms'

const id = '01910000-0000-7000-8000-000000000001'

describe('algorithm API contracts', () => {
  it('accepts a catalog card with progress', () => {
    const result = problemCatalogSchema.safeParse({
      items: [
        {
          id,
          title: 'Two sum',
          difficulty: 'easy',
          topics: ['arrays'],
          provider: 'internal',
          externalUrl: null,
          languages: ['python'],
          status: 'solved',
          attempts: 3,
          solved: true,
        },
      ],
      topics: ['arrays'],
      total: 1,
    })

    expect(result.success).toBe(true)
  })

  /* Сессия тренажёра не привязана к набору, поэтому practiceSetId приходит null. */
  it('accepts a free trainer session without a practice set', () => {
    const result = practiceSessionSchema.safeParse({
      id,
      practiceSetId: null,
      mode: 'practice',
      status: 'active',
      startedAt: '2026-09-03T18:00:00+00:00',
      deadlineAt: null,
      completedAt: null,
      reflectionMd: null,
    })

    expect(result.success).toBe(true)
  })

  it('accepts an authored problem with cases and templates', () => {
    const result = problemAuthorSchema.safeParse({
      id,
      provider: 'internal',
      externalKey: null,
      externalUrl: null,
      title: 'Two sum',
      statementMd: '# Solve',
      statementHtml: '<h1>Solve</h1>',
      difficulty: 'easy',
      topics: ['arrays'],
      timeLimitMs: 1000,
      memoryLimitKb: 262144,
      status: 'draft',
      testCases: [
        {
          id: '01910000-0000-7000-8000-000000000002',
          position: 0,
          input: '1\n',
          expectedOutput: '2\n',
          isSample: true,
          weight: 1,
        },
      ],
      templates: [
        {
          language: 'python',
          starterCode: '# code',
          solutionCode: 'print(2)',
          validatedAt: '2026-09-03T18:00:00+00:00',
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects a card that lost its progress fields', () => {
    const result = problemCatalogSchema.safeParse({
      items: [{ id, title: 'Two sum', difficulty: 'easy' }],
      topics: [],
      total: 1,
    })

    expect(result.success).toBe(false)
  })
})

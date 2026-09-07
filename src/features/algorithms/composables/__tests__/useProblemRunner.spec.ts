import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAlgorithmProblem,
  getAlgorithmProgress,
  listAlgorithmLanguages,
  listAlgorithmSolutions,
} from '@/api/algorithms'
import type { AlgorithmProblem } from '@/api/schemas/algorithms'

import { useProblemRunner } from '../useProblemRunner'

vi.mock('@/api/algorithms', () => ({
  getAlgorithmProblem: vi.fn(),
  getAlgorithmProgress: vi.fn(),
  getAlgorithmSubmission: vi.fn(),
  listAlgorithmLanguages: vi.fn(),
  listAlgorithmSolutions: vi.fn(),
  runAlgorithm: vi.fn(),
  saveAlgorithmReflection: vi.fn(),
  submitAlgorithm: vi.fn(),
}))

const problem: AlgorithmProblem = {
  id: '01910000-0000-7000-8000-000000000001',
  provider: 'internal',
  externalKey: null,
  externalUrl: null,
  title: 'Two sum',
  statementHtml: '<p>Solve</p>',
  difficulty: 'easy',
  tags: [{ id: '01910000-0000-7000-8000-000000000002', name: 'arrays' }],
  timeLimitMs: 1000,
  memoryLimitKb: 262144,
  samples: [],
  templates: [
    { language: 'python', starterCode: '# python' },
    { language: 'cpp', starterCode: '// cpp' },
    { language: 'kotlin', starterCode: '// kotlin' },
  ],
}

function makeRunner() {
  return useProblemRunner({
    problemId: () => problem.id,
    sessionId: () => 'session-1',
    active: () => true,
  })
}

describe('useProblemRunner', () => {
  beforeEach(() => {
    vi.mocked(getAlgorithmProblem).mockResolvedValue(problem)
    vi.mocked(getAlgorithmProgress).mockRejectedValue(new Error('no progress'))
    vi.mocked(listAlgorithmLanguages).mockResolvedValue([
      { key: 'python', name: 'Python' },
      { key: 'cpp', name: 'C++' },
      { key: 'go', name: 'Go' },
    ])
    vi.mocked(listAlgorithmSolutions).mockResolvedValue([])
  })

  it('offers every language the runner supports, not just the ones with a template', async () => {
    const runner = makeRunner()
    await runner.load()

    expect(runner.languages.value).toEqual(['python', 'cpp', 'go'])
    expect(runner.language.value).toBe('python')
    expect(runner.sourceCode.value).toBe('# python')
  })

  it('starts from a blank file when switching to a language with no author template', async () => {
    const runner = makeRunner()
    await runner.load()

    runner.selectLanguage('go')

    expect(runner.language.value).toBe('go')
    expect(runner.sourceCode.value).toBe('')
  })

  it('keeps a separate draft per language', async () => {
    const runner = makeRunner()
    await runner.load()

    runner.sourceCode.value = 'print(1)'
    runner.selectLanguage('cpp')
    expect(runner.sourceCode.value).toBe('// cpp')

    runner.sourceCode.value = 'int main() {}'
    runner.selectLanguage('python')
    expect(runner.sourceCode.value).toBe('print(1)')

    runner.selectLanguage('cpp')
    expect(runner.sourceCode.value).toBe('int main() {}')
  })

  it('restores the last accepted solution even when it is in the default language', async () => {
    vi.mocked(getAlgorithmProgress).mockResolvedValue({
      problemId: problem.id,
      status: 'solved',
      attempts: 3,
      hintsUsed: 0,
      firstSolvedAt: '2026-09-05T18:33:33.922Z',
      lastAttemptAt: '2026-09-05T22:26:36.083Z',
      complexityMd: null,
      confidence: null,
      reflectionMd: null,
      lastSolutionLanguage: 'python',
      lastSolutionCode: 'print("solved")',
    })

    const runner = makeRunner()
    await runner.load()
    // the progress restore runs in a microtask queued after load() resolves
    await Promise.resolve()
    await Promise.resolve()

    expect(runner.language.value).toBe('python')
    expect(runner.sourceCode.value).toBe('print("solved")')
  })

  it('loads a past solution into the editor as an editable draft', async () => {
    vi.mocked(listAlgorithmSolutions).mockResolvedValue([
      {
        id: '01910000-0000-7000-8000-000000000003',
        language: 'cpp',
        sourceCode: '// old accepted solution',
        finishedAt: '2026-09-01T10:00:00.000Z',
      },
    ])

    const runner = makeRunner()
    await runner.load()
    // the solutions list is fetched in a microtask queued after load() resolves
    await Promise.resolve()
    await Promise.resolve()

    expect(runner.solutions.value).toHaveLength(1)

    runner.loadSolution('01910000-0000-7000-8000-000000000003')

    expect(runner.language.value).toBe('cpp')
    expect(runner.sourceCode.value).toBe('// old accepted solution')
  })

  it('blocks execution while the code is empty', async () => {
    const runner = makeRunner()
    await runner.load()

    runner.sourceCode.value = '   '
    expect(runner.canExecute.value).toBe(false)

    runner.sourceCode.value = 'print(1)'
    expect(runner.canExecute.value).toBe(true)
  })

  it('refuses to execute without an active session', async () => {
    const runner = useProblemRunner({
      problemId: () => problem.id,
      sessionId: () => null,
      active: () => false,
    })
    await runner.load()
    runner.sourceCode.value = 'print(1)'

    expect(runner.canExecute.value).toBe(false)
  })
})

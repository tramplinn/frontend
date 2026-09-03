import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAlgorithmProblem, getAlgorithmProgress, listAlgorithmLanguages } from '@/api/algorithms'
import type { AlgorithmProblem } from '@/api/schemas/algorithms'

import { useProblemRunner } from '../useProblemRunner'

vi.mock('@/api/algorithms', () => ({
  getAlgorithmProblem: vi.fn(),
  getAlgorithmProgress: vi.fn(),
  getAlgorithmSubmission: vi.fn(),
  listAlgorithmLanguages: vi.fn(),
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
  topics: ['arrays'],
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
    // Раннер умеет меньше языков, чем заведено шаблонов у задачи.
    vi.mocked(listAlgorithmLanguages).mockResolvedValue([
      { key: 'python', name: 'Python' },
      { key: 'cpp', name: 'C++' },
    ])
  })

  it('offers only languages the runner actually supports', async () => {
    const runner = makeRunner()
    await runner.load()

    expect(runner.languages.value).toEqual(['python', 'cpp'])
    expect(runner.unavailableLanguages.value).toEqual(['kotlin'])
    expect(runner.language.value).toBe('python')
    expect(runner.sourceCode.value).toBe('# python')
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

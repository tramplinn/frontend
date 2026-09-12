import { computed, ref, type Ref } from 'vue'

import { deleteTemplate, putTemplate } from '@/api/algorithmAuthoring'
import type {
  AlgorithmLanguage,
  ProblemAuthor,
  TemplateAuthor,
} from '@/api/schemas/algorithmAuthoring'
import { ALL_LANGUAGES, AUTOSAVE_DEBOUNCE_MS, type SaveCoordinator } from './problemEditorShared'

export function useTemplateDrafts(loaded: Ref<ProblemAuthor | null>, coordinator: SaveCoordinator) {
  const templateDrafts = ref(
    new Map<AlgorithmLanguage, { starterCode: string; solutionCode: string }>(),
  )
  const timers = new Map<AlgorithmLanguage, ReturnType<typeof setTimeout>>()

  const usedLanguages = computed(
    () => new Set(loaded.value?.templates.map((item) => item.language) ?? []),
  )
  const hasNoValidatedTemplate = computed(
    () => !(loaded.value?.templates.some((item) => item.validatedAt !== null) ?? false),
  )

  function templateDirty(language: AlgorithmLanguage): boolean {
    const draft = templateDrafts.value.get(language)
    if (!draft) return false
    const saved = loaded.value?.templates.find((item) => item.language === language)
    return (
      draft.starterCode !== (saved?.starterCode ?? '') ||
      draft.solutionCode !== (saved?.solutionCode ?? '')
    )
  }

  const anyDirty = computed(() => ALL_LANGUAGES.some((language) => templateDirty(language)))

  function sync(problem: ProblemAuthor): void {
    templateDrafts.value = new Map(
      problem.templates.map((item) => [
        item.language,
        { starterCode: item.starterCode, solutionCode: item.solutionCode },
      ]),
    )
  }

  function clearTimers(): void {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  function upsertTemplate(template: TemplateAuthor): void {
    const problem = loaded.value
    if (!problem) return
    const index = problem.templates.findIndex((item) => item.language === template.language)
    if (index === -1) problem.templates.push(template)
    else problem.templates.splice(index, 1, template)
  }

  function patchTemplate(
    language: AlgorithmLanguage,
    changes: Partial<{ starterCode: string; solutionCode: string }>,
  ): void {
    const current = templateDrafts.value.get(language) ?? { starterCode: '', solutionCode: '' }
    templateDrafts.value = new Map(templateDrafts.value).set(language, { ...current, ...changes })
    clearTimeout(timers.get(language))
    timers.set(
      language,
      setTimeout(() => {
        timers.delete(language)
        void saveTemplate(language)
      }, AUTOSAVE_DEBOUNCE_MS),
    )
  }

  async function saveTemplate(language: AlgorithmLanguage): Promise<boolean> {
    if (!templateDirty(language)) return true
    return coordinator.enqueueSave(async () => {
      const problem = loaded.value
      const draft = templateDrafts.value.get(language)
      if (!problem || !draft || !templateDirty(language)) return
      const saved = await putTemplate(problem.id, language, draft.starterCode, draft.solutionCode)
      upsertTemplate(saved)
    })
  }

  /** Апсерт по перечисленным языкам — шаблоны для остальных языков не трогает. */
  async function applyAssistantTemplates(
    templates: { language: AlgorithmLanguage; starterCode: string; solutionCode: string }[],
  ): Promise<void> {
    const problem = loaded.value
    if (!problem) return
    await coordinator.flushQueue()
    await coordinator.run('assistant-templates', async () => {
      for (const item of templates) {
        clearTimeout(timers.get(item.language))
        timers.delete(item.language)
        const saved = await putTemplate(
          problem.id,
          item.language,
          item.starterCode,
          item.solutionCode,
        )
        upsertTemplate(saved)
        templateDrafts.value = new Map(templateDrafts.value).set(item.language, {
          starterCode: saved.starterCode,
          solutionCode: saved.solutionCode,
        })
      }
    })
  }

  async function removeTemplate(language: AlgorithmLanguage): Promise<void> {
    clearTimeout(timers.get(language))
    timers.delete(language)
    await coordinator.flushQueue()
    const problem = loaded.value
    if (!problem) return
    await coordinator.run(`template:${language}`, async () => {
      await deleteTemplate(problem.id, language)
      problem.templates = problem.templates.filter((item) => item.language !== language)
      const nextDrafts = new Map(templateDrafts.value)
      nextDrafts.delete(language)
      templateDrafts.value = nextDrafts
    })
  }

  function templateOf(language: string): TemplateAuthor | undefined {
    return loaded.value?.templates.find((item) => item.language === language)
  }

  function invalidateTemplates(): void {
    const problem = loaded.value
    if (!problem) return
    problem.templates = problem.templates.map((item) => ({ ...item, validatedAt: null }))
  }

  return {
    templateDrafts,
    usedLanguages,
    hasNoValidatedTemplate,
    anyDirty,
    templateDirty,
    sync,
    clearTimers,
    upsertTemplate,
    patchTemplate,
    saveTemplate,
    applyAssistantTemplates,
    removeTemplate,
    templateOf,
    invalidateTemplates,
  }
}

import type { ContentStatus } from '@/api/schemas/common'
import type { ModuleTree, Track } from '@/api/schemas/content'

export const toggleContentStatus = (status: ContentStatus): ContentStatus =>
  status === 'published' ? 'draft' : 'published'

export const contentStatusAction = (status: ContentStatus): string =>
  status === 'published' ? 'снять' : 'опубликовать'

export function publishedItemCount(module: ModuleTree): number {
  return module.items.filter((item) => {
    const content =
      item.kind === 'lesson' ? item.lesson : item.kind === 'quiz' ? item.quiz : item.practiceSet
    return content.status === 'published'
  }).length
}

export function isPublishedModuleEmpty(module: ModuleTree): boolean {
  return module.status === 'published' && publishedItemCount(module) === 0
}

export function orderedCourses(track: Track): Track['courses'] {
  return [...track.courses].sort((a, b) => a.position - b.position)
}

export function swapAdjacent(ids: string[], index: number, delta: number): string[] | null {
  const next = [...ids]
  const current = next[index]
  const other = next[index + delta]
  if (current === undefined || other === undefined) {
    return null
  }
  next[index] = other
  next[index + delta] = current
  return next
}

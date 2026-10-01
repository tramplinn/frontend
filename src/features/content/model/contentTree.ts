import type { ContentStatus } from '@/api/schemas/common'
import type { ModuleItem, ModuleTree, Track } from '@/api/schemas/content'
import { translate } from '@/i18n'

export const toggleContentStatus = (status: ContentStatus): ContentStatus =>
  status === 'published' ? 'draft' : 'published'

export const contentStatusAction = (status: ContentStatus): string =>
  translate(status === 'published' ? 'manage.unpublishShort' : 'manage.publish')

export function itemStatus(item: ModuleItem): ContentStatus {
  return item.kind === 'lesson'
    ? item.lesson.status
    : item.kind === 'quiz'
      ? item.quiz.status
      : item.practiceSet.status
}

export function publishedItemCount(module: ModuleTree): number {
  return module.items.filter((item) => itemStatus(item) === 'published').length
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

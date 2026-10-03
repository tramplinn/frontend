import type { ProfileBlock } from '@/api/schemas/projects'
import type { PublicProfile } from '@/api/schemas/users'

/** Блок рисуем строго в порядке layout и только если ему есть что показать:
    пустой блок «Проекты» у пользователя без проектов не нужен. */
export function profileBlocksToRender(profile: PublicProfile): ProfileBlock[] {
  return profile.layout.filter((block) => {
    switch (block) {
      case 'about':
        return profile.bio !== null || profile.interests.length > 0
      case 'projects':
        return profile.projects.length > 0
      case 'stats':
        return profile.completedLessons !== null
      case 'courses':
        return profile.activeCourses.length > 0
      case 'resume':
        return profile.resumeUrl !== null
    }
  })
}

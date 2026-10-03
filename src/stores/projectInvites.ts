import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { acceptInvite, declineInvite, listMyInvites } from '@/api/projects'
import type { ProjectCard, ProjectInvite } from '@/api/schemas/projects'

/** Входящие приглашения: счётчик в шапке и карточки в /me читают одно состояние. */
export const useProjectInvitesStore = defineStore('projectInvites', () => {
  const items = ref<ProjectInvite[]>([])
  const loaded = ref(false)
  const busyId = ref<string | null>(null)

  const count = computed(() => items.value.length)

  async function load(): Promise<void> {
    items.value = await listMyInvites()
    loaded.value = true
  }

  async function respond<T>(inviteId: string, action: () => Promise<T>): Promise<T> {
    busyId.value = inviteId
    try {
      const result = await action()
      items.value = items.value.filter((item) => item.id !== inviteId)
      return result
    } finally {
      busyId.value = null
    }
  }

  function accept(inviteId: string): Promise<ProjectCard> {
    return respond(inviteId, () => acceptInvite(inviteId))
  }

  function decline(inviteId: string): Promise<void> {
    return respond(inviteId, () => declineInvite(inviteId))
  }

  function reset(): void {
    items.value = []
    loaded.value = false
  }

  return { items, loaded, busyId, count, load, accept, decline, reset }
})

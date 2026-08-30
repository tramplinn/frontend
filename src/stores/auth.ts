import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { fetchMe, githubLoginUrl, logout as logoutRequest, restoreSession } from '@/api/auth'
import type { Me } from '@/api/schemas/auth'

type Status = 'idle' | 'restoring' | 'ready'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Me | null>(null)
  const status = ref<Status>('idle')

  const isAuthenticated = computed(() => user.value !== null)
  const isTeacher = computed(() => user.value?.role === 'teacher' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.name ?? user.value?.login ?? '')

  async function restore(): Promise<void> {
    if (status.value !== 'idle') {
      return
    }
    status.value = 'restoring'
    try {
      user.value = await restoreSession()
    } finally {
      status.value = 'ready'
    }
  }

  async function reload(): Promise<void> {
    user.value = await fetchMe()
  }

  async function login(nextPath: string): Promise<void> {
    const { authorizeUrl } = await githubLoginUrl(nextPath)
    window.location.assign(authorizeUrl)
  }

  function forget(): void {
    user.value = null
  }

  async function logout(): Promise<void> {
    await logoutRequest()
    user.value = null
  }

  return {
    user,
    status,
    isAuthenticated,
    isTeacher,
    isAdmin,
    displayName,
    forget,
    restore,
    reload,
    login,
    logout,
  }
})

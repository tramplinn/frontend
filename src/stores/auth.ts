import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  fetchMe,
  listProviders,
  loginUrl,
  logout as logoutRequest,
  restoreSession,
} from '@/api/auth'
import type { Me } from '@/api/schemas/auth'
import type { IdentityProvider } from '@/api/schemas/common'

type Status = 'idle' | 'restoring' | 'ready'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Me | null>(null)
  const status = ref<Status>('idle')
  // Кнопки входа рисуем по ответу сервера: непрописанного провайдера в нём нет.
  const providers = ref<IdentityProvider[]>([])

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

  async function loadProviders(): Promise<void> {
    if (providers.value.length === 0) {
      providers.value = (await listProviders()).providers
    }
  }

  async function login(provider: IdentityProvider, nextPath: string): Promise<void> {
    const { authorizeUrl } = await loginUrl(provider, nextPath)
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
    providers,
    loadProviders,
    login,
    logout,
  }
})

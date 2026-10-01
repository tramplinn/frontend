import { computed, reactive, ref } from 'vue'

import { linkUrl, requestEmailLinkCode, unlinkIdentity, verifyEmailLinkCode } from '@/api/auth'
import type { IdentityProvider } from '@/api/schemas/common'
import { errorText } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'
import { translate } from '@/i18n'

export function useIdentityLinking() {
  const auth = useAuthStore()

  const busyAction = ref<string | null>(null)
  const anyBusy = computed(() => busyAction.value !== null)
  const error = ref<string | null>(null)

  const identities = computed(() => auth.user?.identities ?? [])
  const canUnlink = computed(() => identities.value.length > 1)
  const linkedProviders = computed(() => new Set(identities.value.map((item) => item.provider)))
  const unlinked = computed(() => auth.providers.filter((item) => !linkedProviders.value.has(item)))
  const emailLinked = computed(() => linkedProviders.value.has('email'))

  const emailLinkStep = ref<'idle' | 'request' | 'code'>('idle')
  const linkEmail = ref('')
  const linkCode = ref('')

  async function link(provider: IdentityProvider): Promise<void> {
    busyAction.value = `link:${provider}`
    error.value = null
    try {
      const { authorizeUrl } = await linkUrl(provider, '/me')
      window.location.assign(authorizeUrl)
    } catch {
      error.value = translate('identity.linkFailed')
      busyAction.value = null
    }
  }

  async function unlink(provider: IdentityProvider): Promise<void> {
    busyAction.value = `unlink:${provider}`
    error.value = null
    try {
      await unlinkIdentity(provider)
      await auth.reload()
    } catch {
      error.value = translate('identity.unlinkFailed')
    } finally {
      busyAction.value = null
    }
  }

  function startEmailLink(): void {
    emailLinkStep.value = 'request'
    error.value = null
  }

  function cancelEmailLink(): void {
    emailLinkStep.value = 'idle'
    linkEmail.value = ''
    linkCode.value = ''
  }

  async function sendEmailLinkCode(): Promise<void> {
    const value = linkEmail.value.trim()
    if (!value) return
    busyAction.value = 'email-request'
    error.value = null
    try {
      await requestEmailLinkCode(value)
      emailLinkStep.value = 'code'
    } catch (cause) {
      error.value = errorText(cause)
    } finally {
      busyAction.value = null
    }
  }

  async function confirmEmailLink(): Promise<void> {
    if (linkCode.value.length !== 6) return
    busyAction.value = 'email-confirm'
    error.value = null
    try {
      await verifyEmailLinkCode(linkEmail.value.trim(), linkCode.value)
      await auth.reload()
      cancelEmailLink()
    } catch (cause) {
      error.value = errorText(cause)
    } finally {
      busyAction.value = null
    }
  }

  return reactive({
    busyAction,
    anyBusy,
    error,
    identities,
    canUnlink,
    unlinked,
    emailLinked,
    emailLinkStep,
    linkEmail,
    linkCode,
    link,
    unlink,
    startEmailLink,
    cancelEmailLink,
    sendEmailLinkCode,
    confirmEmailLink,
  })
}

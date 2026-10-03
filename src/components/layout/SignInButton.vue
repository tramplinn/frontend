<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { IdentityProvider } from '@/api/schemas/common'
import AppButton from '@/components/ui/AppButton.vue'
import BrandMark from '@/components/layout/BrandMark.vue'
import ProviderIcon from '@/components/layout/ProviderIcon.vue'
import OtpInput from '@/components/ui/OtpInput.vue'
import { runBusyAction } from '@/lib/asyncAction'
import { useI18n } from '@/i18n'
import { errorText } from '@/lib/errors'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    nextPath: string
    label?: string | undefined
    size?: 'sm' | 'md'
    /** Открыть окно сразу — например, когда гард роутера не пустил на закрытую страницу. */
    autoOpen?: boolean
  }>(),
  { label: undefined, size: 'md', autoOpen: false },
)
const emit = defineEmits<{ close: [] }>()

type Step = 'providers' | 'email-code'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()
const open = ref(false)
const step = ref<Step>('providers')
const busy = ref(false)
const pendingProvider = ref<IdentityProvider | null>(null)
const error = ref<string | null>(null)
const email = ref('')
const code = ref('')

onMounted(() => {
  void auth.loadProviders()
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') reset()
}

watch(open, (value) => {
  if (value) {
    window.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    window.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

function reset(): void {
  if (open.value) emit('close')
  open.value = false
  step.value = 'providers'
  busy.value = false
  pendingProvider.value = null
  error.value = null
  email.value = ''
  code.value = ''
}

async function signIn(provider: IdentityProvider): Promise<void> {
  busy.value = true
  pendingProvider.value = provider
  error.value = null
  try {
    await auth.login(provider, props.nextPath)
  } catch (cause) {
    error.value = errorText(cause)
    busy.value = false
    pendingProvider.value = null
  }
}

function start(): void {
  error.value = null
  step.value = 'providers'
  open.value = true
}

watch(
  () => props.autoOpen,
  (value) => {
    if (value && !open.value) start()
  },
  { immediate: true },
)

const busyHandlers = {
  setBusy: (active: boolean) => (busy.value = active),
  clearError: () => (error.value = null),
  setError: (cause: unknown) => (error.value = errorText(cause)),
}

async function sendCode(): Promise<void> {
  const value = email.value.trim()
  if (!value) return
  await runBusyAction(busyHandlers, async () => {
    await auth.requestEmailCode(value)
    step.value = 'email-code'
  })
}

async function submitCode(): Promise<void> {
  if (code.value.length !== 6) return
  await runBusyAction(busyHandlers, async () => {
    const target = props.nextPath
    await auth.loginWithEmail(email.value.trim(), code.value)
    reset()
    // OAuth возвращает на nextPath через бэкенд, вход по коду — без перезагрузки.
    if (router.currentRoute.value.fullPath !== target) await router.push(target)
  })
}
</script>

<template>
  <div class="signin">
    <AppButton :size="props.size" variant="primary" @click="start">
      {{ props.label ?? t('auth.signIn') }}
    </AppButton>

    <Teleport to="body">
      <div v-if="open" class="overlay" @click.self="reset">
        <div class="panel" role="dialog" aria-modal="true" :aria-label="t('auth.dialog')">
          <button type="button" class="close" :aria-label="t('common.close')" @click="reset">
            ×
          </button>

          <div class="head">
            <div class="brand">
              <BrandMark />
              <span>{{ t('app.brand') }}</span>
            </div>
            <p class="lead">{{ t('auth.lead') }}</p>
          </div>

          <template v-if="step === 'providers'">
            <div v-if="auth.providers.length > 0" class="providers">
              <AppButton
                v-for="provider in auth.providers"
                :key="provider"
                variant="secondary"
                :loading="pendingProvider === provider"
                :disabled="busy && pendingProvider !== provider"
                @click="signIn(provider)"
              >
                <ProviderIcon :provider="provider" />
                {{ providerName(provider) }}
              </AppButton>
            </div>

            <p v-if="auth.providers.length === 0 && auth.providersError" class="providers-error">
              {{ t('auth.providersFailed') }}
            </p>

            <div v-if="auth.providers.length > 0" class="divider">
              <span>{{ t('auth.orEmail') }}</span>
            </div>

            <form class="email-form" @submit.prevent="sendCode">
              <input
                v-model="email"
                type="email"
                class="text-field"
                :placeholder="t('auth.emailPlaceholder')"
                autocomplete="email"
                required
              />
              <AppButton type="submit" variant="primary" :loading="busy">{{
                t('auth.getCode')
              }}</AppButton>
            </form>
          </template>

          <form v-else class="email-form" @submit.prevent="submitCode">
            <p class="hint">{{ t('auth.codeSent', { email }) }}</p>
            <OtpInput v-model="code" autofocus :disabled="busy" @complete="submitCode" />
            <AppButton type="submit" variant="primary" :loading="busy">{{
              t('auth.signIn')
            }}</AppButton>
            <button type="button" class="link-btn" :disabled="busy" @click="sendCode">
              {{ t('auth.resendCode') }}
            </button>
            <button type="button" class="link-btn" :disabled="busy" @click="step = 'providers'">
              {{ t('auth.back') }}
            </button>
          </form>

          <span v-if="error" class="error" role="alert">{{ error }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.signin {
  display: inline-flex;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgb(0 0 0 / 45%);
}

.panel {
  position: relative;
  display: grid;
  gap: var(--space-4);
  width: min(360px, 100%);
  padding: var(--space-8) var(--space-6) var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-raised);
}

.close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-title);
  line-height: 1;
  cursor: pointer;
}

.close:hover {
  background: var(--surface);
  color: var(--text);
}

.head {
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  text-align: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  color: var(--accent);
}

.lead {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.providers {
  display: grid;
  gap: var(--space-3);
}

.providers :deep(.btn) {
  width: 100%;
  justify-content: flex-start;
  gap: var(--space-3);
  padding-left: var(--space-4);
}

.providers-error {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-micro);
}

.divider::before,
.divider::after {
  flex: 1;
  height: 1px;
  background: var(--border);
  content: '';
}

.email-form {
  display: grid;
  gap: var(--space-3);
}

.email-form :deep(.btn) {
  width: 100%;
}

.hint {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.link-btn {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--accent);
  font-size: var(--text-caption);
  text-align: left;
  cursor: pointer;
}

.link-btn:disabled {
  color: var(--text-muted);
  cursor: default;
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
</style>

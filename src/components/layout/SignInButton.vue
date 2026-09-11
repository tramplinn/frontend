<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { IdentityProvider } from '@/api/schemas/common'
import AppButton from '@/components/ui/AppButton.vue'
import { errorText } from '@/lib/errors'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{ nextPath: string; label?: string; size?: 'sm' | 'md'; floatError?: boolean }>(),
  { label: 'войти', size: 'md', floatError: false },
)

type Step = 'providers' | 'email-request' | 'email-code'

const auth = useAuthStore()
const open = ref(false)
const step = ref<Step>('providers')
const busy = ref(false)
const error = ref<string | null>(null)
const email = ref('')
const code = ref('')

onMounted(() => {
  void auth.loadProviders().catch(() => {})
})

function reset(): void {
  open.value = false
  step.value = 'providers'
  busy.value = false
  error.value = null
  email.value = ''
  code.value = ''
}

async function signIn(provider: IdentityProvider): Promise<void> {
  busy.value = true
  error.value = null
  try {
    await auth.login(provider, props.nextPath)
  } catch (cause) {
    error.value = errorText(cause)
    busy.value = false
  }
}

/** Один провайдер и нет входа по почте отдельным шагом — сразу редиректим, без выбора. */
function start(): void {
  error.value = null
  const only = auth.providers.length === 1 ? auth.providers[0] : undefined
  if (only) {
    void signIn(only)
    return
  }
  step.value = auth.providers.length === 0 ? 'email-request' : 'providers'
  open.value = true
}

function chooseEmail(): void {
  step.value = 'email-request'
  error.value = null
}

async function sendCode(): Promise<void> {
  const value = email.value.trim()
  if (!value) return
  busy.value = true
  error.value = null
  try {
    await auth.requestEmailCode(value)
    step.value = 'email-code'
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}

async function submitCode(): Promise<void> {
  if (code.value.length !== 6) return
  busy.value = true
  error.value = null
  try {
    await auth.loginWithEmail(email.value.trim(), code.value)
    reset()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="signin">
    <AppButton v-if="!open" :size="props.size" variant="primary" @click="start">
      {{ props.label }}
    </AppButton>

    <div v-else class="panel" :class="{ 'panel--float': props.floatError }">
      <button type="button" class="close" aria-label="Закрыть" @click="reset">×</button>

      <template v-if="step === 'providers'">
        <AppButton
          v-for="provider in auth.providers"
          :key="provider"
          :size="props.size"
          variant="secondary"
          :loading="busy"
          @click="signIn(provider)"
        >
          {{ providerName(provider) }}
        </AppButton>
        <button type="button" class="link-btn" @click="chooseEmail">войти по почте</button>
      </template>

      <form v-else-if="step === 'email-request'" class="email-form" @submit.prevent="sendCode">
        <input
          v-model="email"
          type="email"
          class="text-field"
          placeholder="почта"
          autocomplete="email"
          required
        />
        <AppButton type="submit" :size="props.size" variant="primary" :loading="busy">
          получить код
        </AppButton>
        <button
          v-if="auth.providers.length > 0"
          type="button"
          class="link-btn"
          @click="step = 'providers'"
        >
          назад
        </button>
      </form>

      <form v-else class="email-form" @submit.prevent="submitCode">
        <p class="hint">код отправлен на {{ email }}</p>
        <input
          v-model="code"
          inputmode="numeric"
          pattern="\d{6}"
          maxlength="6"
          class="text-field"
          placeholder="код из письма"
          autocomplete="one-time-code"
          required
        />
        <AppButton type="submit" :size="props.size" variant="primary" :loading="busy">
          войти
        </AppButton>
        <button type="button" class="link-btn" :disabled="busy" @click="sendCode">
          отправить код ещё раз
        </button>
      </form>

      <span v-if="error" class="error" role="alert">{{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
.signin {
  position: relative;
  display: inline-flex;
}

.panel {
  display: grid;
  gap: var(--space-2);
  min-width: 220px;
  padding-top: var(--space-6);
}

.panel--float {
  position: absolute;
  z-index: 10;
  top: calc(100% + var(--space-2));
  right: 0;
  padding: var(--space-6) var(--space-4) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  box-shadow: var(--shadow-raised);
}

.close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-title);
  line-height: 1;
  cursor: pointer;
}

.email-form {
  display: grid;
  gap: var(--space-2);
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

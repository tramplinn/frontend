<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { IdentityProvider } from '@/api/schemas/common'
import AppButton from '@/components/ui/AppButton.vue'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{ nextPath: string; label?: string; size?: 'sm' | 'md' }>(),
  { label: 'войти', size: 'md' },
)

const auth = useAuthStore()
const signingIn = ref(false)
const failed = ref(false)
const choosing = ref(false)

onMounted(() => {
  void auth.loadProviders().catch(() => {})
})

async function signIn(provider: IdentityProvider): Promise<void> {
  signingIn.value = true
  failed.value = false
  try {
    await auth.login(provider, props.nextPath)
  } catch {
    failed.value = true
    signingIn.value = false
  }
}

/** Один провайдер — сразу вход, несколько — сначала выбор. */
function start(): void {
  const only = auth.providers.length === 1 ? auth.providers[0] : undefined
  if (only) {
    void signIn(only)
    return
  }
  choosing.value = true
}
</script>

<template>
  <template v-if="choosing">
    <AppButton
      v-for="provider in auth.providers"
      :key="provider"
      :size="props.size"
      variant="secondary"
      :loading="signingIn"
      @click="signIn(provider)"
    >
      {{ providerName(provider) }}
    </AppButton>
  </template>
  <AppButton v-else :size="props.size" variant="primary" :loading="signingIn" @click="start">
    {{ props.label }}
  </AppButton>
  <span v-if="failed" class="error" role="alert">не удалось войти</span>
</template>

<style scoped>
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
</style>

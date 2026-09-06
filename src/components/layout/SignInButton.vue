<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { IdentityProvider } from '@/api/schemas/common'
import AppButton from '@/components/ui/AppButton.vue'
import { providerName } from '@/lib/providers'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{ nextPath: string; label?: string; size?: 'sm' | 'md'; floatError?: boolean }>(),
  { label: 'войти', size: 'md', floatError: false },
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
  <span v-if="failed" class="error" :class="{ 'error--float': props.floatError }" role="alert">
    не удалось войти
  </span>
</template>

<style scoped>
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

/* Только в хедере: там достаточно места лишь под кнопкой входа, и текст
   иначе может обрезаться шапкой фиксированной высоты. */
@media (max-width: 520px) {
  .error--float {
    position: absolute;
    z-index: 10;
    top: calc(100% + var(--space-2));
    right: var(--space-4);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-ctl);
    background: var(--danger-soft);
    white-space: nowrap;
  }
}
</style>

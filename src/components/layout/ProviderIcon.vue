<script setup lang="ts">
import type { IdentityProvider } from '@/api/schemas/common'

defineProps<{ provider: IdentityProvider }>()
</script>

<template>
  <svg v-if="provider === 'github'" class="provider-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
    />
  </svg>

  <svg
    v-else-if="provider === 'gitlab'"
    class="provider-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path fill="#e24329" d="M12 21.5 15.7 10H8.3z" />
    <path fill="#fc6d26" d="M12 21.5 8.3 10H2.8z" />
    <path fill="#fca326" d="M2.8 10 1.5 14a1 1 0 0 0 .36 1.12L12 21.5z" />
    <path fill="#e24329" d="M2.8 10h5.5L6 3.2a.55.55 0 0 0-1.04 0z" />
    <path fill="#fc6d26" d="M12 21.5 15.7 10h5.5z" />
    <path fill="#fca326" d="M21.2 10l1.3 4a1 1 0 0 1-.36 1.12L12 21.5z" />
    <path fill="#e24329" d="M21.2 10h-5.5l2.26-6.8a.55.55 0 0 1 1.04 0z" />
  </svg>

  <svg
    v-else-if="provider === 'yandex'"
    class="provider-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <rect width="20" height="20" rx="5" fill="#fc3f1d" />
    <text x="10" y="14.5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Я</text>
  </svg>

  <svg v-else class="provider-icon" viewBox="0 0 20 20" aria-hidden="true">
    <rect
      x="2"
      y="4"
      width="16"
      height="12"
      rx="2"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
    />
    <path
      d="M3 5.5 10 11 17 5.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.provider-icon {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}
</style>

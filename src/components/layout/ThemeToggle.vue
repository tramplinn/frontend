<script setup lang="ts">
import { computed } from 'vue'

import { useTheme } from '@/composables/useTheme'
import { useI18n } from '@/i18n'

const { choice, cycle } = useTheme()
const { t } = useI18n()

const label = computed(() => t(`theme.${choice.value}`))
</script>

<template>
  <button type="button" class="toggle" :title="label" :aria-label="label" @click="cycle">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.toggle:hover {
  background: var(--surface);
  color: var(--text);
}
</style>

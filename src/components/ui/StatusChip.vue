<script setup lang="ts">
import type { ContentStatus } from '@/api/schemas/common'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ status: ContentStatus }>()
</script>

<template>
  <span class="chip" :class="`chip--${props.status}`">
    {{ props.status === 'published' ? t('ui.published') : t('ui.draft') }}
  </span>
</template>

<style scoped>
.chip--published {
  background: var(--success-soft);
  color: var(--success);
}

.chip--draft {
  background: var(--warning-soft);
  color: var(--warning);
}
</style>

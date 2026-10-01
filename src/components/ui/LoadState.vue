<script setup lang="ts">
import { errorText } from '@/lib/errors'
import AppButton from './AppButton.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ pending: boolean; error: unknown }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <p v-if="props.pending" class="state" role="status">{{ t('ui.loading') }}</p>
  <div v-else-if="props.error" class="state state--error" role="alert">
    <p>{{ errorText(props.error) }}</p>
    <AppButton size="sm" @click="emit('retry')">{{ t('ui.retry') }}</AppButton>
  </div>
  <slot v-else />
</template>

<style scoped>
.state {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.state--error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  color: var(--danger);
}
</style>

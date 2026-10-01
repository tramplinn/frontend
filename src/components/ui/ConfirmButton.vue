<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useArmedConfirm } from '@/composables/useArmedConfirm'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    label?: string | undefined
    confirmLabel?: string | undefined
    loading?: boolean
    disabled?: boolean
    size?: 'md' | 'sm'
  }>(),
  { label: undefined, confirmLabel: undefined, loading: false, disabled: false, size: 'sm' },
)

const emit = defineEmits<{ confirm: [] }>()

const { armed, press } = useArmedConfirm()

function onClick(): void {
  if (press()) emit('confirm')
}
</script>

<template>
  <AppButton
    :size="props.size"
    :variant="armed ? 'danger' : 'quiet'"
    :loading="props.loading"
    :disabled="props.disabled"
    @click="onClick"
  >
    {{ armed ? (props.confirmLabel ?? t('ui.confirmDelete')) : (props.label ?? t('ui.delete')) }}
  </AppButton>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useArmedConfirm } from '@/composables/useArmedConfirm'

const props = withDefaults(
  defineProps<{
    label?: string
    confirmLabel?: string
    loading?: boolean
    disabled?: boolean
    size?: 'md' | 'sm'
  }>(),
  { label: 'удалить', confirmLabel: 'точно удалить?', loading: false, disabled: false, size: 'sm' },
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
    {{ armed ? props.confirmLabel : props.label }}
  </AppButton>
</template>

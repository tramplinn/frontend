<script setup lang="ts">
import { onUnmounted, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    confirmLabel?: string
    loading?: boolean
    size?: 'md' | 'sm'
  }>(),
  { label: 'удалить', confirmLabel: 'точно удалить?', loading: false, size: 'sm' },
)

const emit = defineEmits<{ confirm: [] }>()

const armed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function press(): void {
  if (armed.value) {
    clearTimeout(timer)
    armed.value = false
    emit('confirm')
    return
  }
  armed.value = true
  timer = setTimeout(() => (armed.value = false), 4000)
}

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <AppButton
    :size="props.size"
    :variant="armed ? 'danger' : 'quiet'"
    :loading="props.loading"
    @click="press"
  >
    {{ armed ? props.confirmLabel : props.label }}
  </AppButton>
</template>

<script setup lang="ts">
import { errorText } from '@/lib/errors'

const props = defineProps<{ pending: boolean; error: unknown }>()
</script>

<template>
  <p v-if="props.pending" class="state" role="status">загрузка</p>
  <p v-else-if="props.error" class="state state--error" role="alert">
    {{ errorText(props.error) }}
  </p>
  <slot v-else />
</template>

<style scoped>
.state {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.state--error {
  color: var(--danger);
}
</style>

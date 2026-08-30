<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: number; max: number; label?: string }>(), {
  label: 'Прогресс',
})

const percent = computed(() => (props.max > 0 ? Math.round((props.value / props.max) * 100) : 0))
</script>

<template>
  <ProgressRoot
    class="track"
    :model-value="props.value"
    :max="Math.max(props.max, 1)"
    :aria-label="props.label"
  >
    <ProgressIndicator class="fill" :style="{ width: `${String(percent)}%` }" />
  </ProgressRoot>
</template>

<style scoped>
.track {
  position: relative;
  display: block;
  width: 100%;
  height: var(--space-1);
  background: var(--surface-hover);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-pill);
}
</style>

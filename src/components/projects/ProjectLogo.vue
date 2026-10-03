<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ title: string; url: string | null; size?: number }>(), {
  size: 48,
})

const initial = computed(() => props.title.trim().slice(0, 1).toUpperCase() || '·')
</script>

<template>
  <img
    v-if="url"
    :src="url"
    :alt="title"
    class="logo"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
  <span
    v-else
    class="logo logo--empty"
    aria-hidden="true"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size / 2.4)}px` }"
    >{{ initial }}</span
  >
</template>

<style scoped>
.logo {
  flex: 0 0 auto;
  border-radius: var(--radius-ctl);
  object-fit: cover;
  background: var(--surface);
}
.logo--empty {
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: var(--weight-semibold);
}
</style>

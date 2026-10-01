<script setup lang="ts">
import type { Asset } from '@/api/schemas/assets'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ photos: Asset[]; busy: boolean }>()

const emit = defineEmits<{
  move: [index: number, delta: number]
  detach: [assetId: string]
}>()
</script>

<template>
  <ul class="strip">
    <li v-for="(photo, index) in props.photos" :key="photo.id" class="item">
      <img :src="photo.url" :alt="photo.filename" class="thumb" loading="lazy" />

      <div class="controls">
        <button
          type="button"
          class="control"
          :disabled="props.busy || index === 0"
          :aria-label="t('photos.left')"
          @click="emit('move', index, -1)"
        >
          ←
        </button>
        <button
          type="button"
          class="control"
          :disabled="props.busy || index === props.photos.length - 1"
          :aria-label="t('photos.right')"
          @click="emit('move', index, 1)"
        >
          →
        </button>
        <button
          type="button"
          class="control control--danger"
          :disabled="props.busy"
          :aria-label="t('photos.remove')"
          @click="emit('detach', photo.id)"
        >
          ✕
        </button>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.strip {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-bottom: var(--space-2);
  overflow-x: auto;
  list-style: none;
}

.item {
  flex: 0 0 auto;
}

.thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.controls {
  display: flex;
  justify-content: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.control {
  min-width: var(--ctl-sm);
  height: var(--ctl-sm);
  border: none;
  border-radius: var(--radius-ctl);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: var(--text-caption);
  cursor: pointer;
}

.control:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text);
}

.control:disabled {
  opacity: 0.4;
  cursor: default;
}

.control--danger:hover:not(:disabled) {
  color: var(--danger);
}
</style>

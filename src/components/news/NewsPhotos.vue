<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Asset } from '@/api/schemas/assets'

const props = withDefaults(defineProps<{ photos: Asset[]; compact?: boolean }>(), {
  compact: false,
})

const current = ref(0)
const shown = computed(() => props.photos[Math.min(current.value, props.photos.length - 1)])
</script>

<template>
  <figure class="gallery" :class="{ 'gallery--compact': props.compact }">
    <img
      v-if="shown"
      :src="shown.url"
      :alt="shown.filename"
      class="photo"
      loading="lazy"
      decoding="async"
    />

    <!-- Одна фотография — переключать нечего, полосу не показываем вовсе. -->
    <div v-if="props.photos.length > 1" class="thumbs">
      <button
        v-for="(photo, index) in props.photos"
        :key="photo.id"
        type="button"
        class="thumb"
        :class="{ 'thumb--active': index === current }"
        :aria-label="`Фото ${String(index + 1)} из ${String(props.photos.length)}`"
        :aria-current="index === current"
        @click="current = index"
      >
        <img :src="photo.url" :alt="photo.filename" loading="lazy" decoding="async" />
      </button>
    </div>
  </figure>
</template>

<style scoped>
.gallery {
  margin: 0;
}

.photo {
  width: 100%;
  height: var(--news-photo-height, 420px);
  object-fit: cover;
  background: var(--surface);
}

.gallery--compact .photo {
  height: var(--news-photo-height, 240px);
}

.thumbs {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
}

.thumb {
  flex: 0 0 auto;
  width: 56px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface);
  cursor: pointer;
}

.thumb--active {
  border-color: var(--accent);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

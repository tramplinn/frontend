<script setup lang="ts">
import { ref } from 'vue'

import { uploadAsset } from '@/api/admin'
import { assetMimeSchema } from '@/api/schemas/admin'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ alt: string }>()

const assetId = defineModel<string | null>('assetId', { required: true })
const url = defineModel<string | null>('url', { required: true })

const uploading = ref(false)
const error = ref<string | null>(null)

// Обложкой может быть только картинка: pdf из общего whitelist бэкенд отклонит.
const IMAGE_MIMES = assetMimeSchema.options.filter((mime) => mime.startsWith('image/'))

async function pick(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Сбрасываем сразу: иначе повторный выбор того же файла не даст change.
  input.value = ''
  if (!file) {
    return
  }
  const mime = assetMimeSchema.safeParse(file.type)
  if (!mime.success || !mime.data.startsWith('image/')) {
    error.value = `Обложкой может быть только изображение: ${IMAGE_MIMES.join(', ')}`
    return
  }
  error.value = null
  uploading.value = true
  try {
    const asset = await uploadAsset(file, mime.data)
    assetId.value = asset.id
    url.value = asset.url
  } catch {
    error.value = `Не удалось загрузить ${file.name}`
  } finally {
    uploading.value = false
  }
}

function drop(): void {
  assetId.value = null
  url.value = null
}
</script>

<template>
  <div class="cover">
    <span class="label">обложка</span>
    <div class="body">
      <img v-if="url" :src="url" :alt="props.alt" class="preview" />
      <span v-else class="preview preview--empty">нет</span>

      <div class="actions">
        <label class="upload">
          <input
            type="file"
            class="file"
            :accept="IMAGE_MIMES.join(',')"
            :disabled="uploading"
            @change="pick"
          />
          <span class="upload-text">{{ uploading ? 'загружаю…' : 'выбрать файл' }}</span>
        </label>
        <AppButton v-if="url" size="sm" variant="quiet" @click="drop">убрать</AppButton>
      </div>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.cover {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.preview {
  width: var(--space-12);
  height: var(--space-12);
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--card);
}

.preview--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.upload {
  cursor: pointer;
}

.file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.upload-text {
  display: inline-flex;
  align-items: center;
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-muted);
  font-size: var(--text-caption);
  transition: color var(--motion-fast) var(--ease);
}

.upload:hover .upload-text {
  color: var(--text);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
</style>

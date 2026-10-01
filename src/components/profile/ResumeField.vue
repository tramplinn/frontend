<script setup lang="ts">
import { ref } from 'vue'

import { uploadAsset } from '@/api/assets'
import AppButton from '@/components/ui/AppButton.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const assetId = defineModel<string | null>('assetId', { required: true })
const url = defineModel<string | null>('url', { required: true })

const uploading = ref(false)
const error = ref<string | null>(null)

async function pick(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Сбрасываем сразу: иначе повторный выбор того же файла не даст change.
  input.value = ''
  if (!file) {
    return
  }
  if (file.type !== 'application/pdf') {
    error.value = t('profile.resumeOnlyPdf')
    return
  }
  error.value = null
  uploading.value = true
  try {
    const asset = await uploadAsset(file, 'application/pdf')
    assetId.value = asset.id
    url.value = asset.url
  } catch {
    error.value = t('profile.resumeUploadFailed', { name: file.name })
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
  <div class="resume">
    <span class="label">{{ t('profile.resume') }}</span>
    <div class="body">
      <a v-if="url" :href="url" target="_blank" rel="noopener" class="preview">{{
        t('profile.openPdf')
      }}</a>
      <span v-else class="preview preview--empty">{{ t('profile.notUploaded') }}</span>

      <div class="actions">
        <label class="upload">
          <input
            type="file"
            class="file"
            accept="application/pdf"
            :disabled="uploading"
            @change="pick"
          />
          <span class="upload-text">{{
            uploading ? t('profile.uploading') : t('profile.chooseFile')
          }}</span>
        </label>
        <AppButton v-if="url" size="sm" variant="quiet" @click="drop">{{
          t('profile.remove')
        }}</AppButton>
      </div>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.resume {
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
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}

.preview--empty {
  color: var(--text-muted);
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
  border-radius: var(--radius-ctl);
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

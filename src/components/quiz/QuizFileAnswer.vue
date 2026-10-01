<script setup lang="ts">
import { ref } from 'vue'

import { uploadAsset } from '@/api/assets'
import { assetMimeSchema, type Asset } from '@/api/schemas/assets'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{ questionId: string; reviewing: boolean }>()
const emit = defineEmits<{ answer: [value: unknown] }>()

const asset = ref<Asset | null>(null)
const confirmed = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

function publish(): void {
  if (!asset.value) return
  emit('answer', { asset_id: asset.value.id, confirmed: confirmed.value })
}

async function pickFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const mime = assetMimeSchema.safeParse(file.type)
  if (!mime.success) {
    error.value = t('quiz.fileType')
    return
  }

  uploading.value = true
  error.value = null
  try {
    asset.value = await uploadAsset(file, mime.data)
    publish()
  } catch {
    error.value = t('quiz.uploadFailed')
  } finally {
    uploading.value = false
  }
}

function setConfirmed(value: boolean): void {
  confirmed.value = value
  publish()
}
</script>

<template>
  <div class="file-answer">
    <label class="file-picker">
      {{ asset?.filename ?? t('quiz.attach') }}
      <input
        class="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        :disabled="reviewing || uploading"
        @change="pickFile"
      />
    </label>
    <label v-if="asset" class="self-check">
      <AppCheckbox
        :id="`confirmed-${questionId}`"
        :model-value="confirmed"
        :disabled="reviewing"
        @update:model-value="setConfirmed"
      />
      {{ t('quiz.selfCheck') }}
    </label>
    <span v-if="error" class="upload-error">{{ error }}</span>
  </div>
</template>

<style scoped>
.file-answer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-left: var(--space-8);
}

.file-picker {
  align-self: flex-start;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--surface);
  color: var(--accent);
  cursor: pointer;
}

.self-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-caption);
}

.upload-error {
  color: var(--danger);
  font-size: var(--text-caption);
}

@media (max-width: 620px) {
  .file-answer {
    margin-left: 0;
  }

  .file-picker {
    width: 100%;
    text-align: center;
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { deleteAsset, listAssets, uploadAsset } from '@/api/admin'
import type { Asset } from '@/api/schemas/admin'
import { assetMimeSchema } from '@/api/schemas/admin'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { assetMarkdown } from '@/lib/assetMarkdown'
import { errorText } from '@/lib/errors'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'

const assets = ref<Asset[]>([])
const total = ref(0)
const pending = ref(true)
const error = ref<unknown>(null)
const actionError = ref<string | null>(null)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const broken = ref(new Set<string>())

/** Тот же whitelist, что на сервере: image/svg+xml сюда не входит намеренно. */
const ACCEPT = assetMimeSchema.options.join(',')

function isImage(asset: Asset): boolean {
  return asset.mime !== 'application/pdf' && !broken.value.has(asset.id)
}

function markBroken(assetId: string): void {
  broken.value = new Set(broken.value).add(assetId)
}

function size(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} Б`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    const page = await listAssets()
    assets.value = page.items
    total.value = page.total
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

async function pick(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  const mime = assetMimeSchema.safeParse(file.type)
  if (!mime.success) {
    actionError.value = `Тип ${file.type || 'неизвестен'} не разрешён. Можно: ${ACCEPT}`
    input.value = ''
    return
  }
  uploading.value = true
  actionError.value = null
  try {
    const created = await uploadAsset(file, mime.data)
    assets.value = [created, ...assets.value]
    total.value += 1
  } catch (cause) {
    actionError.value = errorText(cause)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function remove(asset: Asset): Promise<void> {
  actionError.value = null
  try {
    await deleteAsset(asset.id)
    assets.value = assets.value.filter((item) => item.id !== asset.id)
    total.value -= 1
  } catch (cause) {
    actionError.value = errorText(cause)
  }
}

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Буфер обмена без разрешения недоступен — это не повод падать.
  }
}

onMounted(() => void load())
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">медиа</h1>
      <p class="lede">
        Картинки и вложения для уроков. SVG не принимается: он исполняет JS, а файлы отдаются со
        своего домена.
      </p>
    </header>

    <div class="toolbar">
      <input ref="fileInput" class="visually-hidden" type="file" :accept="ACCEPT" @change="pick" />
      <AppButton variant="primary" size="sm" :loading="uploading" @click="fileInput?.click()">
        загрузить файл
      </AppButton>
      <span class="count">{{ total }} в хранилище</span>
    </div>

    <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>

    <LoadState :pending="pending" :error="error">
      <p v-if="assets.length === 0" class="empty">хранилище пустое</p>

      <div v-else class="grid">
        <article v-for="asset in assets" :key="asset.id" class="card">
          <div class="preview">
            <img
              v-if="isImage(asset)"
              :src="asset.url"
              :alt="asset.filename"
              class="thumb"
              @error="markBroken(asset.id)"
            />
            <span v-else class="badge">
              {{ asset.mime === 'application/pdf' ? 'PDF' : 'не открылся' }}
            </span>
          </div>

          <div class="body">
            <p class="filename">{{ asset.filename }}</p>
            <p class="meta">{{ size(asset.size) }}</p>
          </div>

          <RowMenu class="actions" :label="`Действия: ${asset.filename}`">
            <RowMenuItem @select="copy(assetMarkdown(asset))">копировать для урока</RowMenuItem>
            <RowMenuItem @select="copy(asset.url)">копировать ссылку</RowMenuItem>
            <RowMenuItem danger @select="remove(asset)">удалить файл</RowMenuItem>
          </RowMenu>
        </article>
      </div>
    </LoadState>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: var(--space-6);
}

.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.lede {
  max-width: var(--measure);
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.count {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.action-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 132px;
  background: var(--surface);
}

.thumb {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.badge {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  letter-spacing: 0.08em;
}

.body {
  padding: var(--space-3) var(--space-4);
}

.filename {
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  overflow-wrap: anywhere;
}

.meta {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.actions {
  align-self: flex-end;
  margin-top: auto;
  padding: 0 var(--space-2) var(--space-2);
}

.empty {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

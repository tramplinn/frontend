<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import LessonBody from '@/components/lesson/LessonBody.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    html: string
    sourceLabel: string
    dragging?: boolean
    uploading?: boolean
    assetError?: string | null
    previewError?: string | null
    emptyText?: string
    minHeight?: string
  }>(),
  {
    dragging: false,
    uploading: false,
    assetError: null,
    previewError: null,
    emptyText: 'Начните писать',
    minHeight: '60vh',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  source: [element: HTMLTextAreaElement | null]
  paste: [event: ClipboardEvent]
  drop: [event: DragEvent]
  dragover: [event: DragEvent]
  dragleave: [event: DragEvent]
}>()

const source = ref<HTMLTextAreaElement | null>(null)

function update(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

onMounted(() => {
  emit('source', source.value)
})
onUnmounted(() => {
  emit('source', null)
})
</script>

<template>
  <div class="markdown-editor" :style="{ '--markdown-editor-min-height': props.minHeight }">
    <div class="pane">
      <div class="pane-head">
        <span class="pane-title">markdown</span>
        <span v-if="props.uploading" class="pane-meta">загружаю изображение…</span>
        <slot v-else name="source-meta" />
      </div>
      <textarea
        ref="source"
        class="source"
        :class="{ 'source--drop': props.dragging }"
        :value="props.modelValue"
        spellcheck="false"
        :aria-label="props.sourceLabel"
        @input="update"
        @paste="emit('paste', $event)"
        @drop="emit('drop', $event)"
        @dragover="emit('dragover', $event)"
        @dragleave="emit('dragleave', $event)"
      />
      <p v-if="props.assetError" class="error">{{ props.assetError }}</p>
    </div>

    <div class="pane">
      <div class="pane-head"><span class="pane-title">предпросмотр</span></div>
      <div class="preview">
        <LessonBody v-if="props.html" :html="props.html" />
        <span v-else class="empty">{{ props.emptyText }}</span>
      </div>
      <p v-if="props.previewError" class="error">{{ props.previewError }}</p>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.pane {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.pane-head {
  display: flex;
  min-height: 20px;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.pane-title,
.pane-meta,
.empty,
.error {
  font-size: var(--text-caption);
}

.pane-title,
.pane-meta,
.empty {
  color: var(--text-muted);
}

.pane-meta,
:slotted(*) {
  margin-left: auto;
}

.source,
.preview {
  width: 100%;
  min-height: var(--markdown-editor-min-height);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.source {
  padding: var(--space-4);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  line-height: 1.7;
  resize: vertical;
}

.source:focus {
  border-color: var(--accent);
  outline: none;
}

.source--drop {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.preview {
  padding: var(--space-6);
  overflow-x: auto;
}

.error {
  margin-top: var(--space-2);
  color: var(--danger);
}

@media (max-width: 1000px) {
  .markdown-editor {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { NewsDraft } from '@/api/news'
import type { News } from '@/api/schemas/news'
import AppButton from '@/components/ui/AppButton.vue'
import { blankToNull } from '@/lib/forms'

const props = defineProps<{ news: News; busy: boolean }>()

const emit = defineEmits<{
  save: [changes: Partial<NewsDraft>]
  cancel: []
}>()

const title = ref(props.news.title)
const slug = ref(props.news.slug)
const summary = ref(props.news.summary ?? '')
const bodyMd = ref(props.news.bodyMd)

const valid = computed(() => title.value.trim().length > 0 && slug.value.trim().length > 0)

function save(): void {
  if (!valid.value) {
    return
  }
  emit('save', {
    title: title.value.trim(),
    slug: slug.value.trim(),
    summary: blankToNull(summary.value),
    bodyMd: bodyMd.value,
  })
}
</script>

<template>
  <form class="editor" @submit.prevent="save">
    <div class="fields">
      <label class="field">
        <span class="label">заголовок</span>
        <input v-model="title" class="text-field" />
      </label>

      <label class="field">
        <span class="label">адрес</span>
        <input v-model="slug" class="text-field slug" />
      </label>

      <label class="field field--wide">
        <span class="label">анонс</span>
        <textarea v-model="summary" class="text-field" rows="2"></textarea>
      </label>

      <label class="field field--wide">
        <span class="label">текст (markdown)</span>
        <textarea v-model="bodyMd" class="text-field body" rows="8"></textarea>
      </label>
    </div>

    <div class="actions">
      <AppButton type="submit" size="sm" variant="primary" :disabled="!valid" :loading="props.busy">
        сохранить
      </AppButton>
      <AppButton size="sm" variant="quiet" @click="emit('cancel')">отмена</AppButton>
    </div>
  </form>
</template>

<style scoped>
@import '@/styles/editor-form.css';

/* Многострочные поля общей высоты .text-field не переживают. */
.editor textarea.text-field {
  height: auto;
  padding: var(--space-2) var(--space-4);
  line-height: 1.5;
  resize: vertical;
}

.body {
  font-family: var(--font-mono);
}
</style>

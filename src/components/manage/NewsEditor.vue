<script setup lang="ts">
import { ref } from 'vue'

import type { NewsDraft } from '@/api/news'
import type { News } from '@/api/schemas/news'
import EntityFieldset from '@/components/manage/EntityFieldset.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { EditorField } from '@/composables/useEntityForm'
import { useEntityForm } from '@/composables/useEntityForm'
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

const fields: EditorField<NewsDraft>[] = [
  { key: 'title', label: 'заголовок', model: title, toValue: (raw) => raw.trim() },
  { key: 'slug', label: 'адрес', model: slug, mono: true, toValue: (raw) => raw.trim() },
  {
    key: 'summary',
    label: 'анонс',
    model: summary,
    width: 'wide',
    multiline: true,
    toValue: blankToNull,
  },
  {
    key: 'bodyMd',
    label: 'текст (markdown)',
    model: bodyMd,
    width: 'wide',
    multiline: true,
    rows: 8,
    mono: true,
    autoHeight: true,
    toValue: (raw) => raw,
  },
]

const { valid, buildPatch } = useEntityForm(title, slug, fields)

function save(): void {
  if (!valid.value) {
    return
  }
  emit('save', buildPatch())
}
</script>

<template>
  <form class="editor" @submit.prevent="save">
    <EntityFieldset :fields="fields" />

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
</style>

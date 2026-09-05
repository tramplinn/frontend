<script setup lang="ts">
import { ref } from 'vue'

import type { TrackDraft } from '@/api/authoring'
import type { Track } from '@/api/schemas/content'
import EntityFieldset from '@/components/manage/EntityFieldset.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { EditorField } from '@/composables/useEntityForm'
import { useEntityForm } from '@/composables/useEntityForm'
import { blankToNull } from '@/lib/forms'

const props = defineProps<{ track: Track; busy: boolean }>()

const emit = defineEmits<{
  save: [changes: Partial<TrackDraft>]
  cancel: []
}>()

const title = ref(props.track.title)
const slug = ref(props.track.slug)
const description = ref(props.track.description ?? '')
const color = ref(props.track.color ?? '')

const fields: EditorField<TrackDraft>[] = [
  { key: 'title', label: 'название', model: title, toValue: (raw) => raw.trim() },
  { key: 'slug', label: 'адрес', model: slug, mono: true, toValue: (raw) => raw.trim() },
  {
    key: 'description',
    label: 'описание',
    model: description,
    width: 'wide',
    multiline: true,
    toValue: blankToNull,
  },
  { key: 'color', label: 'цвет', model: color, placeholder: '#2B7FFF', toValue: blankToNull },
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

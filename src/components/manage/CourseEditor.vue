<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { CourseDraft } from '@/api/authoring'
import type { Course } from '@/api/schemas/content'
import { listTags } from '@/api/tags'
import CoverField from '@/components/manage/CoverField.vue'
import EntityFieldset from '@/components/manage/EntityFieldset.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TagPicker from '@/components/ui/TagPicker.vue'
import type { EditorField } from '@/composables/useEntityForm'
import { useEntityForm } from '@/composables/useEntityForm'
import { blankToNull, numberOrNull } from '@/lib/forms'

const props = defineProps<{ course: Course; busy: boolean }>()

const emit = defineEmits<{
  save: [changes: Partial<CourseDraft>]
  cancel: []
}>()

const title = ref(props.course.title)
const slug = ref(props.course.slug)
const summary = ref(props.course.summary ?? '')
const color = ref(props.course.color ?? '')
const estHours = ref(props.course.estHours === null ? '' : String(props.course.estHours))
const coverAssetId = ref(props.course.coverAssetId)
const coverUrl = ref(props.course.coverUrl)
const tags = ref(props.course.tags.map((tag) => tag.name))
const tagSuggestions = ref<string[]>([])
onMounted(async () => {
  tagSuggestions.value = (await listTags()).map((tag) => tag.name)
})

const fields: EditorField<CourseDraft>[] = [
  { key: 'title', label: 'название', model: title, toValue: (raw) => raw.trim() },
  { key: 'slug', label: 'адрес', model: slug, mono: true, toValue: (raw) => raw.trim() },
  {
    key: 'summary',
    label: 'аннотация',
    model: summary,
    width: 'wide',
    multiline: true,
    toValue: blankToNull,
  },
  { key: 'color', label: 'цвет', model: color, placeholder: '#2B7FFF', toValue: blankToNull },
  {
    key: 'estHours',
    label: 'часов',
    model: estHours,
    width: 'narrow',
    inputmode: 'numeric',
    toValue: numberOrNull,
  },
]

const { valid, buildPatch } = useEntityForm(title, slug, fields)

function save(): void {
  if (!valid.value) {
    return
  }
  emit('save', { ...buildPatch(), coverAssetId: coverAssetId.value, tags: tags.value })
}
</script>

<template>
  <form class="editor" @submit.prevent="save">
    <EntityFieldset :fields="fields" />

    <CoverField
      v-model:asset-id="coverAssetId"
      v-model:url="coverUrl"
      :alt="`Обложка курса ${props.course.title}`"
    />

    <label class="field">
      <span>темы</span>
      <TagPicker v-model="tags" :suggestions="tagSuggestions" />
    </label>

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

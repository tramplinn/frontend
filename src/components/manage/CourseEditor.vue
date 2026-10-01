<script setup lang="ts">
import { computed, ref } from 'vue'

import type { CourseDraft } from '@/api/authoring'
import type { Course } from '@/api/schemas/content'
import CoverField from '@/components/manage/CoverField.vue'
import EntityFieldset from '@/components/manage/EntityFieldset.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TagPicker from '@/components/ui/TagPicker.vue'
import type { EditorField } from '@/composables/useEntityForm'
import { useEntityForm } from '@/composables/useEntityForm'
import { useTagSuggestions } from '@/composables/useTagSuggestions'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { ACCENT_COLOR_PLACEHOLDER, blankToNull, numberOrNull } from '@/lib/forms'
import { translate, useI18n } from '@/i18n'

const { t } = useI18n()

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
const tagSuggestions = useTagSuggestions()

const fields: EditorField<CourseDraft>[] = [
  { key: 'title', label: 'fields.title', model: title, toValue: (raw) => raw.trim() },
  { key: 'slug', label: 'fields.slug', model: slug, mono: true, toValue: (raw) => raw.trim() },
  {
    key: 'summary',
    label: 'fields.summary',
    model: summary,
    width: 'wide',
    multiline: true,
    toValue: blankToNull,
  },
  {
    key: 'color',
    label: 'fields.color',
    model: color,
    placeholder: ACCENT_COLOR_PLACEHOLDER,
    toValue: blankToNull,
  },
  {
    key: 'estHours',
    label: 'fields.hours',
    model: estHours,
    width: 'narrow',
    inputmode: 'numeric',
    toValue: numberOrNull,
  },
]

const { valid, buildPatch, dirty: fieldsDirty } = useEntityForm(title, slug, fields)

const initialCoverAssetId = coverAssetId.value
const initialTags = tags.value.slice()
const dirty = computed(
  () =>
    fieldsDirty.value ||
    coverAssetId.value !== initialCoverAssetId ||
    tags.value.length !== initialTags.length ||
    tags.value.some((name, index) => name !== initialTags[index]),
)
useUnsavedChangesGuard(dirty, () => translate('unsaved.course'))

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
      :alt="t('manage.courseCover', { title: props.course.title })"
    />

    <label class="field">
      <span>{{ t('manage.topics') }}</span>
      <TagPicker v-model="tags" :suggestions="tagSuggestions" />
    </label>

    <div class="actions">
      <AppButton type="submit" size="sm" variant="primary" :disabled="!valid" :loading="props.busy">
        {{ t('manage.save') }}
      </AppButton>
      <AppButton size="sm" variant="quiet" @click="emit('cancel')">{{
        t('manage.cancel')
      }}</AppButton>
    </div>
  </form>
</template>

<style scoped>
@import '@/styles/editor-form.css';
</style>

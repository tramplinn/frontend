<script setup lang="ts">
import { computed, ref } from 'vue'

import type { CourseDraft } from '@/api/authoring'
import type { Course } from '@/api/schemas/content'
import CoverField from '@/components/manage/CoverField.vue'
import AppButton from '@/components/ui/AppButton.vue'
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

const valid = computed(() => title.value.trim().length > 0 && slug.value.trim().length > 0)

function save(): void {
  if (!valid.value) {
    return
  }
  emit('save', {
    title: title.value.trim(),
    slug: slug.value.trim(),
    summary: blankToNull(summary.value),
    color: blankToNull(color.value),
    estHours: numberOrNull(estHours.value),
    coverAssetId: coverAssetId.value,
  })
}
</script>

<template>
  <form class="editor" @submit.prevent="save">
    <div class="fields">
      <label class="field">
        <span class="label">название</span>
        <input v-model="title" class="text-field" />
      </label>

      <label class="field">
        <span class="label">адрес</span>
        <input v-model="slug" class="text-field slug" />
      </label>

      <label class="field field--wide">
        <span class="label">аннотация</span>
        <textarea v-model="summary" class="text-field" rows="2"></textarea>
      </label>

      <label class="field">
        <span class="label">цвет</span>
        <input v-model="color" class="text-field" placeholder="#2B7FFF" />
      </label>

      <label class="field field--narrow">
        <span class="label">часов</span>
        <input v-model="estHours" class="text-field" inputmode="numeric" />
      </label>
    </div>

    <CoverField
      v-model:asset-id="coverAssetId"
      v-model:url="coverUrl"
      :alt="`Обложка курса ${props.course.title}`"
    />

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

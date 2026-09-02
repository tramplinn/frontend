<script setup lang="ts">
import { computed, ref } from 'vue'

import type { TrackDraft } from '@/api/authoring'
import type { Track } from '@/api/schemas/content'
import CoverField from '@/components/manage/CoverField.vue'
import AppButton from '@/components/ui/AppButton.vue'
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
const coverAssetId = ref(props.track.coverAssetId)
const coverUrl = ref(props.track.coverUrl)

const valid = computed(() => title.value.trim().length > 0 && slug.value.trim().length > 0)

function save(): void {
  if (!valid.value) {
    return
  }
  emit('save', {
    title: title.value.trim(),
    slug: slug.value.trim(),
    description: blankToNull(description.value),
    color: blankToNull(color.value),
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
        <span class="label">описание</span>
        <textarea v-model="description" class="text-field" rows="2"></textarea>
      </label>

      <label class="field">
        <span class="label">цвет</span>
        <input v-model="color" class="text-field" placeholder="#2B7FFF" />
      </label>
    </div>

    <CoverField
      v-model:asset-id="coverAssetId"
      v-model:url="coverUrl"
      :alt="`Обложка трека ${props.track.title}`"
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

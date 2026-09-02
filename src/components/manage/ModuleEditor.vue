<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ModuleDraft } from '@/api/authoring'
import type { Module } from '@/api/schemas/content'
import AppButton from '@/components/ui/AppButton.vue'
import { blankToNull } from '@/lib/forms'

const props = defineProps<{ module: Module; busy: boolean }>()

const emit = defineEmits<{
  save: [changes: Partial<ModuleDraft>]
  cancel: []
}>()

const title = ref(props.module.title)
const slug = ref(props.module.slug)
const summary = ref(props.module.summary ?? '')

const valid = computed(() => title.value.trim().length > 0 && slug.value.trim().length > 0)

function save(): void {
  if (!valid.value) {
    return
  }
  emit('save', {
    title: title.value.trim(),
    slug: slug.value.trim(),
    summary: blankToNull(summary.value),
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
</style>

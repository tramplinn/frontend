<script setup lang="ts" generic="TDraft">
import type { EditorField } from '@/composables/useEntityForm'

defineProps<{ fields: EditorField<TDraft>[] }>()
</script>

<template>
  <div class="fields">
    <label
      v-for="field in fields"
      :key="String(field.key)"
      class="field"
      :class="field.width && `field--${field.width}`"
    >
      <span class="label">{{ field.label }}</span>
      <textarea
        v-if="field.multiline"
        v-model="field.model.value"
        class="text-field"
        :class="{ mono: field.mono, auto: field.autoHeight }"
        :rows="field.rows ?? 2"
      ></textarea>
      <input
        v-else
        v-model="field.model.value"
        class="text-field"
        :class="{ mono: field.mono }"
        :inputmode="field.inputmode"
        :placeholder="field.placeholder"
      />
    </label>
  </div>
</template>

<style scoped>
@import '@/styles/editor-form.css';
</style>

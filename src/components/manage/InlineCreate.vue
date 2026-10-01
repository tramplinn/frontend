<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import { slugify } from '@/lib/slug'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    label: string
    placeholder?: string | undefined
    saving?: boolean
    showSlug?: boolean
  }>(),
  { placeholder: undefined, saving: false, showSlug: true },
)

const emit = defineEmits<{ create: [value: { title: string; slug: string }] }>()

const open = ref(false)
const title = ref('')
const input = ref<HTMLInputElement | null>(null)

/** autofocus срабатывает только при загрузке страницы, а поле появляется
    по v-if — фокус ставим руками, иначе первый набор уходит в никуда. */
async function reveal(): Promise<void> {
  open.value = true
  await nextTick()
  input.value?.focus()
}

const slug = computed(() => slugify(title.value))
const valid = computed(() => title.value.trim().length > 0 && slug.value.length > 0)

function submit(): void {
  if (!valid.value) {
    return
  }
  emit('create', { title: title.value.trim(), slug: slug.value })
  title.value = ''
  open.value = false
}
</script>

<template>
  <div class="wrap">
    <AppButton v-if="!open" size="sm" variant="quiet" @click="reveal">
      + {{ props.label }}
    </AppButton>

    <form v-else class="form" @submit.prevent="submit">
      <div class="field">
        <input
          ref="input"
          v-model="title"
          class="text-field input"
          :placeholder="props.placeholder ?? t('manage.titlePlaceholder')"
          :aria-label="props.label"
          @keydown.esc="open = false"
        />
        <span v-if="slug && props.showSlug" class="slug">{{ slug }}</span>
      </div>
      <slot name="fields" />
      <AppButton
        type="submit"
        size="sm"
        variant="primary"
        :disabled="!valid"
        :loading="props.saving"
      >
        {{ t('manage.create') }}
      </AppButton>
      <AppButton size="sm" variant="quiet" @click="open = false">{{
        t('manage.cancel')
      }}</AppButton>
    </form>
  </div>
</template>

<style scoped>
.wrap {
  min-width: 0;
  max-width: 100%;
}

.form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-2);
  max-width: 100%;
}

.field {
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.input {
  width: 100%;
  max-width: 240px;
}

.slug {
  padding-left: var(--space-4);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
}
</style>

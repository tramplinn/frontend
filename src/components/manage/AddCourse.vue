<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import type { Course, Track } from '@/api/schemas/content'
import AppButton from '@/components/ui/AppButton.vue'
import { slugify } from '@/lib/slug'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ track: Track; courses: Course[]; busy: boolean }>()

const emit = defineEmits<{
  create: [draft: { title: string; slug: string }]
  attach: [courseId: string]
}>()

const open = ref(false)
const title = ref('')
const input = ref<HTMLInputElement | null>(null)

const attached = computed(() => new Set(props.track.courses.map((link) => link.course.id)))
const available = computed(() => props.courses.filter((course) => !attached.value.has(course.id)))

const slug = computed(() => slugify(title.value))
const valid = computed(() => title.value.trim().length > 0 && slug.value.length > 0)

const matching = computed(() => {
  const query = title.value.trim().toLowerCase()
  if (query === '') {
    return available.value
  }
  return available.value.filter((course) => course.title.toLowerCase().includes(query))
})

async function reveal(): Promise<void> {
  open.value = true
  await nextTick()
  input.value?.focus()
}

function close(): void {
  open.value = false
  title.value = ''
}

function create(): void {
  if (!valid.value) {
    return
  }
  emit('create', { title: title.value.trim(), slug: slug.value })
  close()
}

function attach(courseId: string): void {
  emit('attach', courseId)
  close()
}
</script>

<template>
  <div class="add">
    <AppButton v-if="!open" size="sm" variant="quiet" @click="reveal">{{
      t('content.addCourse')
    }}</AppButton>

    <div v-else class="panel">
      <form class="row" @submit.prevent="create">
        <div class="field">
          <input
            ref="input"
            v-model="title"
            class="text-field input"
            :placeholder="t('content.courseTitle')"
            :aria-label="t('content.courseTitleLabel')"
            @keydown.esc="close"
          />
          <span v-if="slug" class="slug">{{ slug }}</span>
        </div>
        <AppButton type="submit" size="sm" variant="primary" :disabled="!valid" :loading="busy">
          {{ t('content.createNew') }}
        </AppButton>
        <AppButton size="sm" variant="quiet" @click="close">{{ t('manage.cancel') }}</AppButton>
      </form>

      <div v-if="available.length > 0" class="existing">
        <p class="existing-title">{{ t('content.addExisting') }}</p>
        <p v-if="matching.length === 0" class="empty">{{ t('content.noMatches') }}</p>
        <div v-else class="options">
          <AppButton
            v-for="course in matching"
            :key="course.id"
            size="sm"
            variant="secondary"
            :loading="busy"
            @click="attach(course.id)"
          >
            {{ course.title }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface);
  border-radius: var(--radius-ctl);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-2);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.input {
  width: 260px;
  max-width: 100%;
}

.slug {
  padding-left: var(--space-4);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
}

.existing-title,
.empty {
  margin-bottom: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>

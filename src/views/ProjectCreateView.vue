<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createProject } from '@/api/projects'
import type { ProjectVisibility } from '@/api/schemas/projects'
import BackLink from '@/components/ui/BackLink.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useI18n } from '@/i18n'
import { errorText } from '@/lib/errors'
import { blankToNull } from '@/lib/forms'
import { PROJECT_VISIBILITIES, visibilityHint, visibilityLabel } from '@/lib/projects'
import { slugify } from '@/lib/slug'

const { t } = useI18n()
const router = useRouter()

const title = ref('')
const summary = ref('')
const visibility = ref<ProjectVisibility>('private')
const saving = ref(false)
const error = ref<string | null>(null)

const visibilityOptions = computed(() =>
  PROJECT_VISIBILITIES.map((value) => ({ value, label: visibilityLabel(value) })),
)
const slugPreview = computed(() => slugify(title.value).slice(0, 80) || 'project')

async function submit(): Promise<void> {
  if (!title.value.trim()) return
  saving.value = true
  error.value = null
  try {
    const project = await createProject({
      title: title.value.trim(),
      summary: blankToNull(summary.value),
      visibility: visibility.value,
    })
    await router.push({ name: 'project', params: { slug: project.slug } })
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="create">
    <BackLink :to="{ name: 'projects', query: { tab: 'mine' } }" class="back">{{
      t('projects.back')
    }}</BackLink>
    <form class="card" @submit.prevent="submit">
      <h1>{{ t('projects.createTitle') }}</h1>
      <label
        ><span>{{ t('projects.fields.title') }}</span
        ><input v-model="title" class="text-field" maxlength="120" required autofocus />
        <small class="hint">{{ t('projects.fields.slugPreview', { slug: slugPreview }) }}</small>
      </label>
      <label
        ><span>{{ t('projects.fields.summary') }}</span
        ><textarea v-model="summary" class="text-field" rows="3" maxlength="280"></textarea>
      </label>
      <label
        ><span>{{ t('projects.fields.visibility') }}</span
        ><AppSelect
          v-model="visibility"
          :options="visibilityOptions"
          :label="t('projects.fields.visibility')"
        />
        <small class="hint">{{ visibilityHint(visibility) }}</small>
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <AppButton type="submit" variant="primary" :loading="saving" :disabled="!title.trim()">{{
        t('projects.create')
      }}</AppButton>
    </form>
  </section>
</template>

<style scoped>
.create {
  max-width: 640px;
}
.back {
  display: inline-flex;
  margin-bottom: var(--space-6);
}
.card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}
h1 {
  font-size: var(--text-title);
}
label {
  display: grid;
  gap: var(--space-2);
}
label > span,
.hint {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
textarea.text-field {
  height: auto;
  padding-block: var(--space-3);
  resize: vertical;
}
.error {
  color: var(--danger);
  font-size: var(--text-caption);
}
</style>

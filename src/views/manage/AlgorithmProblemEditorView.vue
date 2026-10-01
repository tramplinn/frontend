<script setup lang="ts">
import { computed } from 'vue'

import TemplateEditor from '@/components/algorithms/TemplateEditor.vue'
import TestCaseRow from '@/components/algorithms/TestCaseRow.vue'
import MarkdownEditor from '@/components/manage/MarkdownEditor.vue'
import TeacherAssistantPanel from '@/components/manage/TeacherAssistantPanel.vue'
import type { TeacherAssistantPatch } from '@/api/schemas/teacherAssistant'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import TagPicker from '@/components/ui/TagPicker.vue'
import { useTagSuggestions } from '@/composables/useTagSuggestions'
import { ALL_LANGUAGES, useProblemEditor } from '@/features/algorithms/composables/useProblemEditor'
import { DIFFICULTY_ORDER, difficultyLabel } from '@/lib/algorithms'
import { renderMarkdown } from '@/lib/markdown'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ problem: string }>()

const {
  actionError,
  addCase,
  applyAssistantCases,
  applyAssistantTemplates,
  assetError,
  autosaving,
  busy,
  caseDrafts,
  checkTemplate,
  dragging,
  dirty,
  editedLanguage,
  error,
  fields,
  hasNoHidden,
  hasNoSample,
  load,
  loaded,
  onDragLeave,
  onDragOver,
  onDrop,
  onPaste,
  patchCase,
  patchTemplate,
  pending,
  publishBlockers,
  removeCase,
  removeTemplate,
  savedAt,
  setStatementField,
  templateDrafts,
  templateOf,
  togglePublished,
  uploadingAsset,
  usedLanguages,
} = useProblemEditor(() => props.problem)

const difficultyOptions = computed(() =>
  DIFFICULTY_ORDER.map((value) => ({ value, label: difficultyLabel(value) })),
)

const currentTemplateDraft = computed(
  () => templateDrafts.value.get(editedLanguage.value) ?? { starterCode: '', solutionCode: '' },
)

const statementPreview = computed(() => renderMarkdown(fields.value?.statementMd ?? ''))

const tagSuggestions = useTagSuggestions()

const assistantDocument = computed(() => {
  const current = fields.value
  const problem = loaded.value
  if (!current || !problem) return { title: '' }
  return {
    title: current.title,
    statementMd: current.statementMd,
    difficulty: current.difficulty,
    tags: current.tags,
    timeLimitMs: current.timeLimitMs,
    memoryLimitKb: current.memoryLimitKb,
    testCases: problem.testCases.map((item) => ({
      input: item.input,
      expectedOutput: item.expectedOutput,
      isSample: item.isSample,
    })),
    templates: problem.templates.map((item) => ({
      language: item.language,
      starterCode: item.starterCode,
      solutionCode: item.solutionCode,
    })),
  }
})

function applyAssistantPatch(patch: TeacherAssistantPatch): void {
  const current = fields.value
  if (!current) return
  if (patch.title !== null) current.title = patch.title
  if (patch.statementMd !== null) current.statementMd = patch.statementMd
  if (patch.difficulty !== null) current.difficulty = patch.difficulty
  if (patch.tags !== null) current.tags = patch.tags
  if (patch.timeLimitMs !== null) current.timeLimitMs = patch.timeLimitMs
  if (patch.memoryLimitKb !== null) current.memoryLimitKb = patch.memoryLimitKb
  if (patch.testCases !== null) void applyAssistantCases(patch.testCases)
  if (patch.templates !== null) void applyAssistantTemplates(patch.templates)
}

/** Прогон по тестам имеет смысл, только когда есть что прогонять и на чём. */
const canValidate = computed(() => {
  return (
    (loaded.value?.testCases.length ?? 0) > 0 &&
    Boolean(currentTemplateDraft.value.solutionCode.trim())
  )
})
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <section v-if="loaded && fields" class="page">
      <header class="head">
        <div class="head-main">
          <h1>{{ loaded.title }}</h1>
          <StatusChip :status="loaded.status" />
          <span v-if="autosaving" class="save-state">{{ t('manage.saving') }}</span>
          <span v-else-if="dirty" class="save-state">{{ t('manage.autosave') }}</span>
          <span v-else-if="savedAt" class="saved">{{ t('manage.saved') }}</span>
        </div>
        <div class="head-actions">
          <AppButton
            size="sm"
            :loading="busy === 'publish'"
            :disabled="loaded.status === 'draft' && publishBlockers.length > 0"
            @click="togglePublished"
          >
            {{ loaded.status === 'published' ? t('manage.unpublish') : t('manage.publish') }}
          </AppButton>
          <BackLink :to="{ name: 'manage-algorithms' }">{{
            t('problemEditor.toLibrary')
          }}</BackLink>
        </div>
      </header>

      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

      <section class="card meta">
        <h2>{{ t('problemEditor.basics') }}</h2>
        <div class="grid">
          <label class="field">
            <span>{{ t('fields.title') }}</span>
            <input v-model="fields.title" type="text" class="form-field" />
          </label>

          <div class="field">
            <span>{{ t('problemEditor.difficulty') }}</span>
            <AppSelect
              v-model="fields.difficulty"
              :options="difficultyOptions"
              :label="t('problemEditor.difficultyLabel')"
            />
          </div>

          <div class="field">
            <span>{{ t('manage.topics') }}</span>
            <TagPicker
              v-model="fields.tags"
              :suggestions="tagSuggestions"
              placeholder="arrays, two pointers"
            />
          </div>

          <label class="field">
            <span>{{ t('problemEditor.timeLimit') }}</span>
            <input
              v-model.number="fields.timeLimitMs"
              type="number"
              min="50"
              max="5000"
              class="form-field"
            />
          </label>

          <label class="field">
            <span>{{ t('problemEditor.memoryLimit') }}</span>
            <input
              v-model.number="fields.memoryLimitKb"
              type="number"
              min="16384"
              max="524288"
              step="1024"
              class="form-field"
            />
          </label>
        </div>

        <MarkdownEditor
          v-model="fields.statementMd"
          :html="statementPreview"
          :source-label="t('problemEditor.statementSource')"
          :empty-text="t('problemEditor.startStatement')"
          min-height="420px"
          :dragging="dragging"
          :uploading="uploadingAsset"
          :asset-error="assetError"
          @source="setStatementField"
          @paste="onPaste"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        />
      </section>

      <section class="cases">
        <div class="cases-head">
          <h2>{{ t('problemEditor.tests') }}</h2>
          <AppButton size="sm" :loading="busy === 'new-case'" @click="addCase">{{
            t('problemEditor.addTest')
          }}</AppButton>
        </div>

        <p v-if="loaded.testCases.length === 0" class="muted">{{ t('problemEditor.addTests') }}</p>
        <template v-else>
          <p v-if="loaded.status === 'draft' && (hasNoSample || hasNoHidden)" class="hint">
            {{ t('problemEditor.needTests') }}
          </p>

          <ul class="case-list">
            <template v-for="(item, index) in loaded.testCases" :key="item.id">
              <TestCaseRow
                v-if="caseDrafts.get(item.id)"
                :test-case="item"
                :draft="caseDrafts.get(item.id)!"
                :number="index + 1"
                :busy="busy === `case:${item.id}`"
                @patch="(changes) => patchCase(item.id, changes)"
                @remove="removeCase(item.id)"
              />
            </template>
          </ul>
        </template>
      </section>

      <TemplateEditor
        v-model:language="editedLanguage"
        :languages="ALL_LANGUAGES"
        :used="usedLanguages"
        :draft="currentTemplateDraft"
        :saved="templateOf(editedLanguage)"
        :busy="busy === `template:${editedLanguage}`"
        :can-validate="canValidate"
        @patch="(changes) => patchTemplate(editedLanguage, changes)"
        @validate="checkTemplate(editedLanguage)"
        @remove="removeTemplate(editedLanguage)"
      />

      <TeacherAssistantPanel
        surface="algorithm_problem"
        :document="assistantDocument"
        @apply="applyAssistantPatch"
      />
    </section>
  </LoadState>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.head-main,
.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.head h1 {
  font-size: var(--text-display);
}

.muted {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.hint {
  color: var(--warning);
  font-size: var(--text-caption);
}

.card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}

.save-state,
.saved {
  font-size: var(--text-caption);
}

.save-state {
  color: var(--text-muted);
}

.saved {
  color: var(--success);
}

h2 {
  font-size: var(--text-title);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.field {
  display: grid;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.grid input,
.grid :deep(.trigger),
.grid :deep(.chips) {
  width: 100%;
  min-height: 46px;
  background: var(--bg);
  font-size: var(--text-input);
}

.grid :deep(.trigger) {
  justify-content: space-between;
}

textarea {
  resize: vertical;
  font-family: var(--font-mono);
}

.cases {
  display: grid;
  gap: var(--space-3);
}

.cases-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.case-list {
  display: grid;
  gap: var(--space-3);
  list-style: none;
}

@media (max-width: 620px) {
  .head {
    align-items: stretch;
  }

  .head-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    width: 100%;
  }

  .head h1 {
    min-width: 0;
    font-size: var(--text-hero);
    overflow-wrap: anywhere;
  }

  .head-main .save-state,
  .head-main .saved {
    grid-column: 1 / -1;
  }

  .head-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

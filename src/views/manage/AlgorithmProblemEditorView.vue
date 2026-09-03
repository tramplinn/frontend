<script setup lang="ts">
import { computed } from 'vue'

import TemplateEditor from '@/components/algorithms/TemplateEditor.vue'
import TestCaseRow from '@/components/algorithms/TestCaseRow.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { ALL_LANGUAGES, useProblemEditor } from '@/features/algorithms/composables/useProblemEditor'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '@/lib/algorithms'

const props = defineProps<{ problem: string }>()

const {
  actionError,
  addCase,
  busy,
  caseDrafts,
  checkTemplate,
  editedLanguage,
  error,
  fields,
  loaded,
  patchCase,
  patchTemplate,
  pending,
  publishBlockers,
  removeCase,
  removeTemplate,
  saveCase,
  saveProblem,
  saveTemplate,
  templateDrafts,
  templateOf,
  togglePublished,
  usedLanguages,
} = useProblemEditor(() => props.problem)

const difficultyOptions = DIFFICULTY_ORDER.map((value) => ({
  value,
  label: DIFFICULTY_LABELS[value],
}))

const currentTemplateDraft = computed(
  () => templateDrafts.value.get(editedLanguage.value) ?? { starterCode: '', solutionCode: '' },
)

/** Прогон по тестам имеет смысл, только когда есть что прогонять и на чём. */
const canValidate = computed(() => {
  const saved = templateOf(editedLanguage.value)
  return (loaded.value?.testCases.length ?? 0) > 0 && Boolean(saved?.solutionCode.trim())
})
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <section v-if="loaded && fields" class="page">
      <header class="head">
        <div class="head-main">
          <h1>{{ loaded.title }}</h1>
          <StatusChip :status="loaded.status" />
        </div>
        <div class="head-actions">
          <AppButton
            size="sm"
            :loading="busy === 'publish'"
            :disabled="loaded.status === 'draft' && publishBlockers.length > 0"
            @click="togglePublished"
          >
            {{ loaded.status === 'published' ? 'снять с публикации' : 'опубликовать' }}
          </AppButton>
          <RouterLink :to="{ name: 'manage-algorithms' }" class="back">← к библиотеке</RouterLink>
        </div>
      </header>

      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

      <ul v-if="loaded.status === 'draft' && publishBlockers.length > 0" class="blockers">
        <li v-for="blocker in publishBlockers" :key="blocker">{{ blocker }}</li>
      </ul>

      <section class="card meta">
        <h2>основное</h2>
        <div class="grid">
          <label class="field">
            <span>название</span>
            <input v-model="fields.title" type="text" />
          </label>

          <div class="field">
            <span>сложность</span>
            <AppSelect
              v-model="fields.difficulty"
              :options="difficultyOptions"
              label="Сложность задачи"
            />
          </div>

          <label class="field">
            <span>темы через запятую</span>
            <input v-model="fields.topics" type="text" placeholder="arrays, two pointers" />
          </label>

          <label class="field">
            <span>лимит времени, мс</span>
            <input v-model.number="fields.timeLimitMs" type="number" min="50" max="5000" />
          </label>

          <label class="field">
            <span>лимит памяти, КиБ</span>
            <input
              v-model.number="fields.memoryLimitKb"
              type="number"
              min="16384"
              max="524288"
              step="1024"
            />
          </label>
        </div>

        <label class="field">
          <span>условие в markdown</span>
          <textarea v-model="fields.statementMd" rows="10" spellcheck="false" />
        </label>

        <div class="row">
          <AppButton variant="primary" :loading="busy === 'problem'" @click="saveProblem">
            сохранить задачу
          </AppButton>
        </div>

        <details v-if="loaded.statementHtml" class="preview">
          <summary>предпросмотр условия</summary>
          <!-- HTML санитизируется backend markdown renderer. -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="prose" v-html="loaded.statementHtml" />
        </details>
      </section>

      <section class="cases">
        <div class="cases-head">
          <h2>тесты</h2>
          <AppButton size="sm" :loading="busy === 'new-case'" @click="addCase">+ тест</AppButton>
        </div>

        <p v-if="loaded.testCases.length === 0" class="muted">
          Пока нет ни одного теста. Хотя бы один должен быть примером — его увидит студент.
        </p>

        <ul v-else class="case-list">
          <template v-for="(item, index) in loaded.testCases" :key="item.id">
            <TestCaseRow
              v-if="caseDrafts.get(item.id)"
              :test-case="item"
              :draft="caseDrafts.get(item.id)!"
              :number="index + 1"
              :busy="busy === `case:${item.id}`"
              @patch="(changes) => patchCase(item.id, changes)"
              @save="saveCase(item.id)"
              @remove="removeCase(item.id)"
            />
          </template>
        </ul>
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
        @save="saveTemplate(editedLanguage)"
        @validate="checkTemplate(editedLanguage)"
        @remove="removeTemplate(editedLanguage)"
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

.back,
.muted {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.error {
  color: var(--danger);
  font-size: var(--text-caption);
}

.blockers {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-8);
  border: 1px solid var(--warning);
  border-radius: var(--radius-card);
  background: var(--warning-soft);
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

input,
textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-input);
}

textarea {
  resize: vertical;
  font-family: var(--font-mono);
}

.row {
  display: flex;
  gap: var(--space-3);
}

.preview summary {
  color: var(--text-muted);
  font-size: var(--text-caption);
  cursor: pointer;
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
</style>

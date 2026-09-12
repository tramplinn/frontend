<script setup lang="ts">
import QuizQuestionEditor from '@/components/quiz-editor/QuizQuestionEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useQuizEditor } from '@/features/quiz-editor/composables/useQuizEditor'

const props = defineProps<{ quiz: string }>()

const {
  loaded,
  lessonOptions,
  boundLesson,
  bindTo,
  load,
  pending,
  error,
  busy,
  isDirty,
  isSaving,
  draftOf,
  patch,
  toggleCorrect,
  setOption,
  addOption,
  removeOption,
  attachFile,
  detachFile,
  add,
  remove,
  togglePublished,
} = useQuizEditor(() => props.quiz)
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <section v-if="loaded">
      <header class="head">
        <h1 class="title">{{ loaded.title }}</h1>
        <StatusChip :status="loaded.status" />
        <AppSelect
          :model-value="boundLesson"
          :options="lessonOptions"
          label="Тема теста"
          :disabled="busy === 'quiz'"
          @update:model-value="bindTo"
        />
        <div class="head-actions">
          <AppButton size="sm" :loading="busy === 'quiz'" @click="togglePublished">
            {{ loaded.status === 'published' ? 'снять с публикации' : 'опубликовать' }}
          </AppButton>
          <BackLink :to="{ name: 'manage-content' }">к списку</BackLink>
        </div>
      </header>

      <p v-if="loaded.questions.length === 0" class="empty">в тесте пока нет вопросов</p>

      <ol class="questions">
        <template v-for="(question, index) in loaded.questions" :key="question.id">
          <QuizQuestionEditor
            v-if="draftOf(question.id)"
            :question="question"
            :draft="draftOf(question.id)!"
            :number="index + 1"
            :busy="busy"
            :dirty="isDirty(question.id)"
            :autosaving="isSaving(question.id)"
            @patch="(changes) => patch(question.id, changes)"
            @toggle-correct="(at) => toggleCorrect(question.id, at)"
            @set-option="(at, value) => setOption(question.id, at, value)"
            @add-option="addOption(question.id)"
            @remove-option="(at) => removeOption(question.id, at)"
            @attach="(file) => attachFile(question.id, file)"
            @detach="(assetId) => detachFile(question.id, assetId)"
            @remove="remove(question.id)"
          />
        </template>
      </ol>

      <AppButton variant="secondary" :loading="busy === 'new'" @click="add">+ вопрос</AppButton>
    </section>
  </LoadState>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.title {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-left: auto;
}

.empty {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.questions {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.empty {
  padding: var(--space-8) 0;
}

@media (max-width: 700px) {
  .head {
    flex-wrap: wrap;
  }

  .head-actions {
    width: 100%;
    margin-left: 0;
  }
}
</style>

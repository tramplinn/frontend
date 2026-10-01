<script setup lang="ts">
import { deleteCourse, deleteModule, updateCourse, updateModule } from '@/api/authoring'
import CourseEditor from '@/components/manage/CourseEditor.vue'
import CourseRow from '@/components/manage/CourseRow.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import ModuleCard from '@/components/manage/ModuleCard.vue'
import type { Course } from '@/api/schemas/content'
import type { useContentManagement } from '@/features/content/composables/useContentManagement'
import { useI18n } from '@/i18n'

const { t } = useI18n()

/* Курс + его дерево модулей нужны и внутри карточки трека, и в плоском
   списке всех курсов — вместо копии одного и того же блока шаблона в двух
   местах он вынесен сюда. content — это весь useContentManagement() целиком
   (как runner в ProblemEditorPanel): состояние open/editing общее на экран,
   поэтому разбирается на рефы тут же, а не читается через props.content.x
   в шаблоне — иначе теряется авто-разворачивание рефов Vue. */
const props = withDefaults(
  defineProps<{
    content: ReturnType<typeof useContentManagement>
    course: Course
    standalone?: boolean
    first?: boolean
    last?: boolean
    trackTitles?: string[]
  }>(),
  { standalone: false, first: true, last: true, trackTitles: () => [] },
)

const emit = defineEmits<{ move: [delta: number]; detach: [] }>()

const {
  busy,
  openSlug,
  editing,
  openCourse,
  openModule,
  openModuleId,
  dependencies,
  loadingCourse,
  courseError,
  courseEmptyForStudents,
  flip,
  toggleCourse,
  toggleEditing,
  run,
  refresh,
  saveCourse,
  saveModule,
  addLesson,
  addQuiz,
  addPractice,
  addModule,
  moveOpenModule,
  moveItem,
  removeItem,
  publishItem,
  publishModuleCascade,
  publishCourseCascade,
} = props.content
</script>

<template>
  <li class="course-tree-item">
    <CourseRow
      :course="props.course"
      :busy="busy"
      :open="openSlug === props.course.slug"
      :standalone="props.standalone"
      :first="props.first"
      :last="props.last"
      :track-titles="props.trackTitles"
      @toggle="toggleCourse(props.course.slug)"
      @publish="run(() => updateCourse(props.course.id, { status: flip(props.course.status) }))"
      @publish-cascade="publishCourseCascade(props.course)"
      @move="(delta) => emit('move', delta)"
      @edit="toggleEditing(props.course.id)"
      @detach="emit('detach')"
      @remove="run(() => deleteCourse(props.course.id))"
    />

    <CourseEditor
      v-if="editing === props.course.id"
      :course="props.course"
      :busy="busy"
      @save="(changes) => saveCourse(props.course.id, changes)"
      @cancel="editing = null"
    />

    <div v-if="openSlug === props.course.slug" class="modules">
      <p v-if="loadingCourse" class="hint">{{ t('content.loading') }}</p>
      <p v-else-if="courseError" class="error">{{ t('content.courseFailed') }}</p>

      <template v-else-if="openCourse">
        <p v-if="openCourse.modules.length === 0" class="hint">{{ t('content.noModules') }}</p>

        <p v-if="courseEmptyForStudents" class="warn">
          {{ t('content.emptyPublished') }}
        </p>

        <ModuleCard
          v-for="(module, moduleIndex) in openCourse.modules"
          :key="module.id"
          :module="module"
          :modules="openCourse.modules"
          :dependencies="dependencies"
          :busy="busy"
          :first="moduleIndex === 0"
          :last="moduleIndex === openCourse.modules.length - 1"
          :editing="editing === module.id"
          :expanded="openModule"
          :deps-open="openModuleId === module.id"
          @edit="toggleEditing(module.id)"
          @save="(changes) => saveModule(module.id, changes)"
          @cancel-edit="editing = null"
          @toggle-deps="openModuleId = openModuleId === module.id ? null : module.id"
          @deps-changed="refresh"
          @publish="run(() => updateModule(module.id, { status: flip(module.status) }))"
          @publish-cascade="publishModuleCascade(module)"
          @move="(delta) => moveOpenModule(moduleIndex, delta)"
          @remove="run(() => deleteModule(module.id))"
          @add-lesson="(draft) => addLesson(module.id, draft)"
          @add-quiz="(draft) => addQuiz(module.id, draft)"
          @add-practice="(draft) => addPractice(module.id, draft)"
          @move-item="(index, delta) => moveItem(module, index, delta)"
          @publish-item="(item) => publishItem(item)"
          @remove-item="(item) => removeItem(item)"
        />

        <InlineCreate
          :label="t('content.module')"
          :placeholder="t('content.moduleTitle')"
          :saving="busy"
          @create="addModule"
        />
      </template>
    </div>
  </li>
</template>

<style scoped>
.course-tree-item {
  list-style: none;
}

.modules {
  padding: var(--space-3) 0 var(--space-4) var(--space-4);
  margin-left: var(--space-4);
  border-left: 1px solid var(--border);
}

.hint {
  padding: var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.error {
  padding: var(--space-3);
  color: var(--danger);
  font-size: var(--text-caption);
}

.warn {
  max-width: var(--measure);
  margin: 0 var(--space-3) var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--warning-soft);
  color: var(--warning);
  border-radius: var(--radius-ctl);
  font-size: var(--text-caption);
}
</style>

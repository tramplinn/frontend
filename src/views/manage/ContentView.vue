<script setup lang="ts">
import {
  attachCourse,
  deleteCourse,
  deleteModule,
  deleteTrack,
  detachCourse,
  updateCourse,
  updateModule,
  updateTrack,
} from '@/api/authoring'
import AddCourse from '@/components/manage/AddCourse.vue'
import CourseRow from '@/components/manage/CourseRow.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import ModuleDependencies from '@/components/manage/ModuleDependencies.vue'
import ModuleItemRow from '@/components/manage/ModuleItemRow.vue'
import LoadState from '@/components/ui/LoadState.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useContentManagement } from '@/features/content/composables/useContentManagement'
import { errorText } from '@/lib/errors'

const {
  tracks,
  allCourses,
  openCourse,
  openSlug,
  dependencies,
  openModuleId,
  openModule,
  pending,
  error,
  busy,
  actionError,
  courseError,
  loadingCourse,
  courseEmptyForStudents,
  flip,
  publishLabel,
  publishedItems,
  isModuleEmptyForStudents,
  ordered,
  toggleCourse,
  refresh,
  run,
  addTrack,
  addCourse,
  addModule,
  addLesson,
  addQuiz,
  removeItem,
  moveModule,
  moveItem,
  move,
} = useContentManagement()
</script>

<template>
  <section>
    <header class="head">
      <div>
        <h1 class="heading">контент</h1>
        <p class="lede">
          Здесь видны и черновики: публичные страницы отдают только опубликованное.
        </p>
      </div>
      <InlineCreate label="трек" placeholder="название трека" :saving="busy" @create="addTrack" />
    </header>

    <p v-if="actionError" class="action-error" role="alert">{{ errorText(actionError) }}</p>

    <LoadState :pending="pending" :error="error">
      <p v-if="tracks.length === 0" class="empty">треков пока нет</p>

      <div v-else class="tracks">
        <article v-for="track in tracks" :key="track.id" class="track">
          <header class="track-head">
            <h2 class="track-title">{{ track.title }}</h2>
            <StatusChip :status="track.status" />
            <RowMenu class="actions" :disabled="busy" :label="`Действия: ${track.title}`">
              <RowMenuItem
                @select="run(() => updateTrack(track.id, { status: flip(track.status) }))"
              >
                {{ publishLabel(track.status) }}
              </RowMenuItem>
              <RowMenuItem danger @select="run(() => deleteTrack(track.id))">
                удалить трек
              </RowMenuItem>
            </RowMenu>
          </header>

          <ul class="courses">
            <li v-for="(link, index) in ordered(track)" :key="link.course.id">
              <CourseRow
                :course="link.course"
                :busy="busy"
                :open="openSlug === link.course.slug"
                :first="index === 0"
                :last="index === track.courses.length - 1"
                @toggle="toggleCourse(link.course.slug)"
                @publish="
                  run(() => updateCourse(link.course.id, { status: flip(link.course.status) }))
                "
                @move="(delta) => move(track, index, delta)"
                @detach="run(() => detachCourse(track.id, link.course.id))"
                @remove="run(() => deleteCourse(link.course.id))"
              />

              <div v-if="openSlug === link.course.slug" class="modules">
                <p v-if="loadingCourse" class="hint">загружаем…</p>
                <p v-else-if="courseError" class="error">курс не открылся</p>

                <template v-else-if="openCourse">
                  <p v-if="openCourse.modules.length === 0" class="hint">в курсе нет модулей</p>

                  <p v-if="courseEmptyForStudents" class="warn">
                    Курс опубликован, но студенты увидят пустую страницу: ни один модуль не
                    опубликован.
                  </p>

                  <div
                    v-for="(module, moduleIndex) in openCourse.modules"
                    :key="module.id"
                    class="module"
                  >
                    <div class="module-head">
                      <span class="module-title">{{ module.title }}</span>
                      <StatusChip :status="module.status" />
                      <span
                        v-if="isModuleEmptyForStudents(module)"
                        class="warn-chip"
                        title="Все уроки и тесты модуля — черновики"
                      >
                        не видно студентам
                      </span>
                      <span class="module-meta">
                        {{ publishedItems(module) }} из {{ module.items.length }} опубликовано
                      </span>
                      <RowMenu
                        class="actions"
                        :disabled="busy"
                        :label="`Действия: ${module.title}`"
                      >
                        <RowMenuItem
                          @select="openModuleId = openModuleId === module.id ? null : module.id"
                        >
                          связи модуля
                        </RowMenuItem>
                        <RowMenuItem
                          @select="
                            run(() => updateModule(module.id, { status: flip(module.status) }))
                          "
                        >
                          {{ publishLabel(module.status) }}
                        </RowMenuItem>
                        <RowMenuItem
                          :disabled="moduleIndex === 0"
                          @select="moveModule(openCourse, moduleIndex, -1)"
                        >
                          выше
                        </RowMenuItem>
                        <RowMenuItem
                          :disabled="moduleIndex === openCourse.modules.length - 1"
                          @select="moveModule(openCourse, moduleIndex, 1)"
                        >
                          ниже
                        </RowMenuItem>
                        <RowMenuItem danger @select="run(() => deleteModule(module.id))">
                          удалить модуль
                        </RowMenuItem>
                      </RowMenu>
                    </div>

                    <div class="module-body">
                      <ModuleDependencies
                        v-if="openModuleId === module.id && openModule"
                        :module="openModule"
                        :modules="openCourse.modules"
                        :dependencies="dependencies"
                        @changed="refresh"
                      />

                      <ul class="items">
                        <ModuleItemRow
                          v-for="(item, itemIndex) in module.items"
                          :key="item.id"
                          :item="item"
                          :busy="busy"
                          :first="itemIndex === 0"
                          :last="itemIndex === module.items.length - 1"
                          @move="(delta) => moveItem(module, itemIndex, delta)"
                          @remove="removeItem(item)"
                        />
                      </ul>

                      <div class="module-add">
                        <InlineCreate
                          label="урок"
                          placeholder="название урока"
                          :saving="busy"
                          @create="(draft) => addLesson(module.id, draft)"
                        />
                        <InlineCreate
                          label="тест"
                          placeholder="название теста"
                          :saving="busy"
                          @create="(draft) => addQuiz(module.id, draft)"
                        />
                      </div>
                    </div>
                  </div>

                  <InlineCreate
                    label="модуль"
                    placeholder="название модуля"
                    :saving="busy"
                    @create="addModule"
                  />
                </template>
              </div>
            </li>
          </ul>

          <AddCourse
            :track="track"
            :courses="allCourses"
            :busy="busy"
            @create="(draft) => addCourse(track, draft)"
            @attach="(courseId) => run(() => attachCourse(track.id, courseId))"
          />
        </article>
      </div>
    </LoadState>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.lede {
  max-width: var(--measure);
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.action-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.tracks {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.track {
  padding: var(--space-6);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.track-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.track-title {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
}

.actions {
  margin-left: auto;
}

.courses,
.items {
  list-style: none;
}

.modules {
  padding: var(--space-3) 0 var(--space-4) var(--space-4);
  margin-left: var(--space-4);
  border-left: 1px solid var(--border);
}

.module + .module {
  margin-top: var(--space-4);
}

.module-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

.module-title {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
}

.module-body {
  padding-left: var(--space-4);
  margin: var(--space-2) 0 0 var(--space-4);
  border-left: 1px solid var(--border);
}

.module-meta {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.module-add {
  display: flex;
  gap: var(--space-2);
  padding-top: var(--space-1);
}

.empty {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
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

.warn-chip {
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--warning-soft);
  color: var(--warning);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}
</style>

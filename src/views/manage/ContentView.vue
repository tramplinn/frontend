<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

import { attachCourse, deleteTrack, detachCourse, updateTrack } from '@/api/authoring'
import AddCourse from '@/components/manage/AddCourse.vue'
import CourseTreeItem from '@/components/manage/CourseTreeItem.vue'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import TrackEditor from '@/components/manage/TrackEditor.vue'
import LoadState from '@/components/ui/LoadState.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useContentManagement } from '@/features/content/composables/useContentManagement'
import { errorText } from '@/lib/errors'

/* CourseTreeItem получает весь объект целиком (как runner в ProblemEditorPanel) —
   он используется и внутри карточки трека, и в плоском списке курсов ниже. */
const content = useContentManagement()
const {
  tracks,
  allCourses,
  courseTrackTitles,
  pending,
  error,
  busy,
  actionError,
  publishReport,
  flip,
  publishLabel,
  ordered,
  run,
  editing,
  toggleEditing,
  saveTrack,
  addTrack,
  addCourse,
  addStandaloneCourse,
  publishTrackCascade,
  move,
  load,
} = content
</script>

<template>
  <section>
    <header class="head">
      <h1 class="heading">контент</h1>
    </header>

    <p v-if="actionError" class="action-error" role="alert">{{ errorText(actionError) }}</p>

    <div v-if="publishReport" class="publish-report" role="status">
      <p>опубликовано: {{ publishReport.published.length }}</p>
      <ul v-if="publishReport.skipped.length > 0" class="publish-skips">
        <li v-for="skip in publishReport.skipped" :key="skip.id">
          «{{ skip.title }}» — {{ skip.reason }}
        </li>
      </ul>
    </div>

    <LoadState :pending="pending" :error="error" @retry="load">
      <TabsRoot default-value="tracks">
        <TabsList class="tabs" aria-label="Раздел контента">
          <TabsTrigger value="tracks" class="tab">треки</TabsTrigger>
          <TabsTrigger value="courses" class="tab">курсы</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks">
          <InlineCreate
            label="трек"
            placeholder="название трека"
            class="tab-create"
            :saving="busy"
            @create="addTrack"
          />

          <p v-if="tracks.length === 0" class="empty">треков пока нет</p>

          <div v-else class="tracks">
            <article v-for="track in tracks" :key="track.id" class="track">
              <header class="track-head">
                <h2 class="track-title">{{ track.title }}</h2>
                <StatusChip :status="track.status" />
                <RowMenu class="actions" :disabled="busy" :label="`Действия: ${track.title}`">
                  <RowMenuItem @select="toggleEditing(track.id)">изменить трек</RowMenuItem>
                  <RowMenuItem
                    @select="run(() => updateTrack(track.id, { status: flip(track.status) }))"
                  >
                    {{ publishLabel(track.status) }}
                  </RowMenuItem>
                  <RowMenuItem @select="publishTrackCascade(track)">
                    опубликовать всё содержимое
                  </RowMenuItem>
                  <RowMenuItem danger @select="run(() => deleteTrack(track.id))">
                    удалить трек
                  </RowMenuItem>
                </RowMenu>
              </header>

              <TrackEditor
                v-if="editing === track.id"
                :track="track"
                :busy="busy"
                @save="(changes) => saveTrack(track.id, changes)"
                @cancel="editing = null"
              />

              <ul class="courses">
                <CourseTreeItem
                  v-for="(link, index) in ordered(track)"
                  :key="link.course.id"
                  :content="content"
                  :course="link.course"
                  :first="index === 0"
                  :last="index === track.courses.length - 1"
                  @move="(delta) => move(track, index, delta)"
                  @detach="run(() => detachCourse(track.id, link.course.id))"
                />
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
        </TabsContent>

        <TabsContent value="courses">
          <InlineCreate
            label="курс"
            placeholder="название курса"
            class="tab-create"
            :saving="busy"
            @create="addStandaloneCourse"
          />

          <p v-if="allCourses.length === 0" class="empty">курсов пока нет</p>

          <ul v-else class="courses">
            <CourseTreeItem
              v-for="course in allCourses"
              :key="course.id"
              :content="content"
              :course="course"
              standalone
              :track-titles="courseTrackTitles.get(course.id) ?? []"
            />
          </ul>
        </TabsContent>
      </TabsRoot>
    </LoadState>
  </section>
</template>

<style scoped>
.head {
  margin-bottom: var(--space-6);
}

.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.action-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.publish-report {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-ctl);
  background: var(--success-soft);
  color: var(--success);
  font-size: var(--text-caption);
}

.publish-skips {
  margin-top: var(--space-2);
  padding-left: var(--space-4);
  color: var(--warning);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.tab {
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.tab:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.tab[data-state='active'] {
  background: var(--selected);
  color: var(--on-selected);
}

.tab-create {
  margin-bottom: var(--space-4);
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

.courses {
  list-style: none;
}

.empty {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

import { ref, type Ref } from 'vue'

import { createPracticeSet, deletePracticeSet, updatePracticeSet } from '@/api/algorithmAuthoring'
import {
  attachCourse,
  createCourse,
  createLesson,
  createModule,
  createQuiz,
  createTrack,
  deleteLesson,
  deleteQuiz,
  publishCourseCascade as publishCourseCascadeRequest,
  publishModuleCascade as publishModuleCascadeRequest,
  publishTrackCascade as publishTrackCascadeRequest,
  reorderModuleItems,
  reorderModules,
  reorderTrackCourses,
  updateCourse,
  updateLesson,
  updateModule,
  updateQuiz,
  updateTrack,
} from '@/api/authoring'
import type { CourseDraft, ModuleDraft, TrackDraft } from '@/api/authoring'
import type { ContentStatus } from '@/api/schemas/common'
import type {
  Course,
  CourseTree,
  ModuleItem,
  ModuleTree,
  PublishReport,
  Track,
} from '@/api/schemas/content'
import {
  itemStatus,
  orderedCourses,
  swapAdjacent,
  toggleContentStatus,
} from '@/features/content/model/contentTree'
import { runBusyAction } from '@/lib/asyncAction'

interface TreeAccess {
  openCourse: Ref<CourseTree | null>
  refresh: () => Promise<void>
  refreshTree: () => Promise<void>
}

export function useContentActions(tree: TreeAccess) {
  const busy = ref(false)
  const actionError = ref<unknown>(null)
  const publishReport = ref<PublishReport | null>(null)
  const editing = ref<string | null>(null)

  function toggleEditing(id: string): void {
    editing.value = editing.value === id ? null : id
  }

  async function perform(
    action: () => Promise<unknown>,
    reload: () => Promise<void>,
  ): Promise<void> {
    await runBusyAction(
      {
        setBusy: (active) => (busy.value = active),
        clearError: () => (actionError.value = null),
        setError: (cause) => (actionError.value = cause),
      },
      async () => {
        await action()
        await reload()
      },
    )
  }

  async function run(action: () => Promise<unknown>): Promise<void> {
    await perform(action, tree.refresh)
  }

  async function runInTree(action: () => Promise<unknown>): Promise<void> {
    await perform(action, tree.refreshTree)
  }

  async function saveEdited(action: () => Promise<unknown>): Promise<void> {
    await run(action)
    if (actionError.value === null) {
      editing.value = null
    }
  }

  function saveTrack(trackId: string, changes: Partial<TrackDraft>): Promise<void> {
    return saveEdited(() => updateTrack(trackId, changes))
  }

  function saveCourse(courseId: string, changes: Partial<CourseDraft>): Promise<void> {
    return saveEdited(() => updateCourse(courseId, changes))
  }

  function saveModule(moduleId: string, changes: Partial<ModuleDraft>): Promise<void> {
    return saveEdited(() => updateModule(moduleId, changes))
  }

  function addTrack(draft: { title: string; slug: string }): void {
    void run(() => createTrack(draft))
  }

  function addCourse(track: Track, draft: { title: string; slug: string }): void {
    void run(async () => {
      const course = await createCourse(draft)
      await attachCourse(track.id, course.id)
    })
  }

  /** Курс без трека — привязать можно позже, из карточки нужного трека. */
  function addStandaloneCourse(draft: { title: string; slug: string }): void {
    void run(() => createCourse(draft))
  }

  function addModule(draft: { title: string; slug: string }): void {
    const course = tree.openCourse.value
    if (course) {
      void runInTree(() => createModule(course.id, { ...draft, position: course.modules.length }))
    }
  }

  function addLesson(moduleId: string, draft: { title: string; slug: string }): void {
    void runInTree(() => createLesson(moduleId, draft))
  }

  function addQuiz(moduleId: string, draft: { title: string; slug: string }): void {
    void runInTree(() => createQuiz(moduleId, draft))
  }

  function addPractice(moduleId: string, draft: { title: string }): void {
    void runInTree(() => createPracticeSet(moduleId, { title: draft.title }))
  }

  function removeItem(item: ModuleItem): void {
    void runInTree(() => {
      if (item.kind === 'lesson') return deleteLesson(item.lesson.id)
      if (item.kind === 'quiz') return deleteQuiz(item.quiz.id)
      return deletePracticeSet(item.practiceSet.id)
    })
  }

  function updateItemStatus(item: ModuleItem, status: ContentStatus): Promise<unknown> {
    if (item.kind === 'lesson') return updateLesson(item.lesson.id, { status })
    if (item.kind === 'quiz') return updateQuiz(item.quiz.id, { status })
    return updatePracticeSet(item.practiceSet.id, { status })
  }

  function publishItem(item: ModuleItem): void {
    void runInTree(() => updateItemStatus(item, toggleContentStatus(itemStatus(item))))
  }

  /* «Опубликовать всё содержимое» — один POST на бэк вместо букета
     параллельных PATCH с фронта (best-effort: публикует всё проходящее
     валидацию, остальное пропускает с причиной; уже опубликованное не
     трогает и публикацию не снимает — см. PublishCascadeService). Экран
     обновляется всегда, даже если что-то пошло не так на середине —
     раньше при частичном сбое сервер мог уйти вперёд, а экран об этом
     не узнавал. */
  async function runCascade(action: () => Promise<PublishReport>): Promise<void> {
    busy.value = true
    actionError.value = null
    publishReport.value = null
    try {
      publishReport.value = await action()
    } catch (cause) {
      actionError.value = cause
    } finally {
      busy.value = false
    }
    // Вызывается через void: упавшее обновление иначе стало бы unhandled rejection.
    await tree.refresh().catch((cause: unknown) => {
      actionError.value ??= cause
    })
  }

  function publishModuleCascade(module: ModuleTree): void {
    void runCascade(() => publishModuleCascadeRequest(module.id))
  }

  function publishCourseCascade(course: Course): void {
    void runCascade(() => publishCourseCascadeRequest(course.id))
  }

  function publishTrackCascade(track: Track): void {
    void runCascade(() => publishTrackCascadeRequest(track.id))
  }

  function moveModule(course: CourseTree, index: number, delta: number): void {
    const ids = swapAdjacent(
      [...course.modules].sort((a, b) => a.position - b.position).map((item) => item.id),
      index,
      delta,
    )
    if (ids) void runInTree(() => reorderModules(course.id, ids))
  }

  function moveOpenModule(index: number, delta: number): void {
    if (tree.openCourse.value) {
      moveModule(tree.openCourse.value, index, delta)
    }
  }

  function moveItem(module: ModuleTree, index: number, delta: number): void {
    const ids = swapAdjacent(
      module.items.map((item) => item.id),
      index,
      delta,
    )
    if (ids) void runInTree(() => reorderModuleItems(module.id, ids))
  }

  function moveCourse(track: Track, index: number, delta: number): void {
    const ids = swapAdjacent(
      orderedCourses(track).map((link) => link.course.id),
      index,
      delta,
    )
    if (ids) void run(() => reorderTrackCourses(track.id, ids))
  }

  return {
    busy,
    actionError,
    publishReport,
    editing,
    toggleEditing,
    run,
    runInTree,
    saveTrack,
    saveCourse,
    saveModule,
    addTrack,
    addCourse,
    addStandaloneCourse,
    addModule,
    addLesson,
    addQuiz,
    addPractice,
    removeItem,
    publishItem,
    publishModuleCascade,
    publishCourseCascade,
    publishTrackCascade,
    moveModule,
    moveOpenModule,
    moveItem,
    moveCourse,
  }
}

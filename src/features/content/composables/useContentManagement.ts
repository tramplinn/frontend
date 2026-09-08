import { computed, onMounted, ref } from 'vue'

import { createPracticeSet, deletePracticeSet } from '@/api/algorithmAuthoring'
import {
  attachCourse,
  createCourse,
  createLesson,
  createModule,
  createQuiz,
  createTrack,
  deleteLesson,
  deleteQuiz,
  getDraftCourse,
  listDraftCourses,
  listDraftModuleDependencies,
  listDraftTracks,
  reorderModuleItems,
  reorderModules,
  reorderTrackCourses,
  updateCourse,
  updateModule,
  updateTrack,
} from '@/api/authoring'
import type { CourseDraft, ModuleDraft, TrackDraft } from '@/api/authoring'
import type {
  Course,
  CourseTree,
  ModuleDependency,
  ModuleItem,
  ModuleTree,
  Track,
} from '@/api/schemas/content'
import {
  contentStatusAction,
  isPublishedModuleEmpty,
  orderedCourses,
  publishedItemCount,
  swapAdjacent,
  toggleContentStatus,
} from '@/features/content/model/contentTree'
import { runBusyAction } from '@/lib/asyncAction'

export function useContentManagement() {
  const tracks = ref<Track[]>([])
  const allCourses = ref<Course[]>([])
  const openCourse = ref<CourseTree | null>(null)
  const openSlug = ref<string | null>(null)
  const dependencies = ref<ModuleDependency[]>([])
  const openModuleId = ref<string | null>(null)
  const pending = ref(true)
  const error = ref<unknown>(null)
  const busy = ref(false)
  const actionError = ref<unknown>(null)
  const courseError = ref<unknown>(null)
  const loadingCourse = ref(false)
  const editing = ref<string | null>(null)

  function toggleEditing(id: string): void {
    editing.value = editing.value === id ? null : id
  }

  async function loadLists(): Promise<void> {
    const [loadedTracks, loadedCourses] = await Promise.all([listDraftTracks(), listDraftCourses()])
    tracks.value = loadedTracks
    allCourses.value = loadedCourses
  }

  async function load(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await loadLists()
    } catch (cause) {
      error.value = cause
    } finally {
      pending.value = false
    }
  }

  async function fetchTree(slug: string): Promise<void> {
    const [tree, moduleDependencies] = await Promise.all([
      getDraftCourse(slug),
      listDraftModuleDependencies(slug),
    ])
    openCourse.value = tree
    dependencies.value = moduleDependencies
  }

  async function openTree(slug: string): Promise<void> {
    loadingCourse.value = true
    courseError.value = null
    try {
      await fetchTree(slug)
    } catch (cause) {
      courseError.value = cause
      openCourse.value = null
    } finally {
      loadingCourse.value = false
    }
  }

  async function toggleCourse(slug: string): Promise<void> {
    if (openSlug.value === slug) {
      openSlug.value = null
      openCourse.value = null
      openModuleId.value = null
      return
    }
    openSlug.value = slug
    openModuleId.value = null
    await openTree(slug)
  }

  async function refresh(): Promise<void> {
    await loadLists()
    await refreshTree()
  }

  async function refreshTree(): Promise<void> {
    if (openSlug.value !== null) {
      await fetchTree(openSlug.value)
    }
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

  async function run(action: () => Promise<unknown>): Promise<void> {
    await perform(action, refresh)
  }

  async function runInTree(action: () => Promise<unknown>): Promise<void> {
    await perform(action, refreshTree)
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
    const course = openCourse.value
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

  function moveModule(course: CourseTree, index: number, delta: number): void {
    const ids = swapAdjacent(
      [...course.modules].sort((a, b) => a.position - b.position).map((item) => item.id),
      index,
      delta,
    )
    if (ids) void runInTree(() => reorderModules(course.id, ids))
  }

  function moveOpenModule(index: number, delta: number): void {
    if (openCourse.value) {
      moveModule(openCourse.value, index, delta)
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

  /* Курс виден в дереве трека, только если к какому-то треку привязан —
     а свежесозданный (или отвязанный после удаления трека) курс может не
     быть привязан ни к одному. Плоская вкладка «курсы» показывает вообще
     все и подписывает, в каких треках курс участвует (их может быть и 0). */
  const courseTrackTitles = computed(() => {
    const byCourse = new Map<string, string[]>()
    for (const track of tracks.value) {
      for (const link of track.courses) {
        byCourse.set(link.course.id, [...(byCourse.get(link.course.id) ?? []), track.title])
      }
    }
    return byCourse
  })

  const openModule = computed(
    () => openCourse.value?.modules.find((item) => item.id === openModuleId.value) ?? null,
  )
  const courseEmptyForStudents = computed(
    () =>
      openCourse.value !== null &&
      openCourse.value.status === 'published' &&
      openCourse.value.modules.every((module) => module.status !== 'published'),
  )

  onMounted(() => void load())

  return {
    tracks,
    allCourses,
    courseTrackTitles,
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
    flip: toggleContentStatus,
    publishLabel: contentStatusAction,
    publishedItems: publishedItemCount,
    isModuleEmptyForStudents: isPublishedModuleEmpty,
    ordered: orderedCourses,
    toggleCourse,
    refresh,
    run,
    runInTree,
    editing,
    toggleEditing,
    saveTrack,
    saveCourse,
    saveModule,
    addTrack,
    addCourse,
    addStandaloneCourse,
    addModule,
    addLesson,
    addPractice,
    addQuiz,
    removeItem,
    moveModule,
    moveOpenModule,
    moveItem,
    move: moveCourse,
  }
}

import { computed, onMounted, ref } from 'vue'

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
} from '@/api/authoring'
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

  async function openTree(slug: string): Promise<void> {
    loadingCourse.value = true
    courseError.value = null
    try {
      const [tree, moduleDependencies] = await Promise.all([
        getDraftCourse(slug),
        listDraftModuleDependencies(slug),
      ])
      openCourse.value = tree
      dependencies.value = moduleDependencies
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
    if (openSlug.value !== null) {
      await openTree(openSlug.value)
    }
  }

  async function run(action: () => Promise<unknown>): Promise<void> {
    busy.value = true
    actionError.value = null
    try {
      await action()
      await refresh()
    } catch (cause) {
      actionError.value = cause
    } finally {
      busy.value = false
    }
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

  function addModule(draft: { title: string; slug: string }): void {
    const course = openCourse.value
    if (course) {
      void run(() => createModule(course.id, { ...draft, position: course.modules.length }))
    }
  }

  function addLesson(moduleId: string, draft: { title: string; slug: string }): void {
    void run(() => createLesson(moduleId, draft))
  }

  function addQuiz(moduleId: string, draft: { title: string; slug: string }): void {
    void run(() => createQuiz(moduleId, draft))
  }

  function removeItem(item: ModuleItem): void {
    void run(() =>
      item.kind === 'lesson' ? deleteLesson(item.lesson.id) : deleteQuiz(item.quiz.id),
    )
  }

  function moveModule(course: CourseTree, index: number, delta: number): void {
    const ids = swapAdjacent(
      [...course.modules].sort((a, b) => a.position - b.position).map((item) => item.id),
      index,
      delta,
    )
    if (ids) void run(() => reorderModules(course.id, ids))
  }

  function moveItem(module: ModuleTree, index: number, delta: number): void {
    const ids = swapAdjacent(
      module.items.map((item) => item.id),
      index,
      delta,
    )
    if (ids) void run(() => reorderModuleItems(module.id, ids))
  }

  function moveCourse(track: Track, index: number, delta: number): void {
    const ids = swapAdjacent(
      orderedCourses(track).map((link) => link.course.id),
      index,
      delta,
    )
    if (ids) void run(() => reorderTrackCourses(track.id, ids))
  }

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
    addTrack,
    addCourse,
    addModule,
    addLesson,
    addQuiz,
    removeItem,
    moveModule,
    moveItem,
    move: moveCourse,
  }
}

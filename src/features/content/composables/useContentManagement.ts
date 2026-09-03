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
  // Открыт максимум один редактор: две формы на одну сущность разошлись бы
  // в значениях, а третья кнопка «сохранить» на экране только мешает.
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

  /**
   * Тянет дерево, не трогая экран: ошибку отдаёт наверх, старое содержимое
   * оставляет на месте. Обновление после действия идёт только сюда — иначе
   * дерево мигало бы «загружаем…» на каждое создание урока или теста.
   */
  async function fetchTree(slug: string): Promise<void> {
    const [tree, moduleDependencies] = await Promise.all([
      getDraftCourse(slug),
      listDraftModuleDependencies(slug),
    ])
    openCourse.value = tree
    dependencies.value = moduleDependencies
  }

  /** Первое открытие курса: показывать пока нечего, поэтому и заглушка уместна. */
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

  /** Уроки, тесты и порядок живут только в дереве открытого курса: списки
      треков и курсов перезапрашивать незачем. */
  async function runInTree(action: () => Promise<unknown>): Promise<void> {
    await perform(action, refreshTree)
  }

  async function perform(
    action: () => Promise<unknown>,
    reload: () => Promise<void>,
  ): Promise<void> {
    busy.value = true
    actionError.value = null
    try {
      await action()
      await reload()
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

  /** Модуль всегда двигают внутри открытого курса, но узнать это из шаблона нельзя. */
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
    runInTree,
    editing,
    toggleEditing,
    saveTrack,
    saveCourse,
    saveModule,
    addTrack,
    addCourse,
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

import { computed, onMounted, ref } from 'vue'

import {
  getDraftCourse,
  listDraftCourses,
  listDraftModuleDependencies,
  listDraftTracks,
} from '@/api/authoring'
import type { Course, CourseTree, ModuleDependency, Track } from '@/api/schemas/content'

/** Курс виден в дереве трека, только если к какому-то треку привязан —
    а свежесозданный (или отвязанный после удаления трека) курс может не
    быть привязан ни к одному. Плоская вкладка «курсы» показывает вообще
    все и подписывает, в каких треках курс участвует (их может быть и 0). */
export function useContentTree() {
  const tracks = ref<Track[]>([])
  const allCourses = ref<Course[]>([])
  const openCourse = ref<CourseTree | null>(null)
  const openSlug = ref<string | null>(null)
  const dependencies = ref<ModuleDependency[]>([])
  const openModuleId = ref<string | null>(null)
  const pending = ref(true)
  const error = ref<unknown>(null)
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

  async function refreshTree(): Promise<void> {
    if (openSlug.value !== null) {
      await fetchTree(openSlug.value)
    }
  }

  async function refresh(): Promise<void> {
    await loadLists()
    await refreshTree()
  }

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
    courseError,
    loadingCourse,
    courseEmptyForStudents,
    toggleCourse,
    refresh,
    refreshTree,
  }
}

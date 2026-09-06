import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getCourse, listModuleDependencies, listTracks } from '@/api/content'
import type {
  CourseTree,
  Lesson,
  ModuleDependency,
  ModuleItem,
  ModuleTree,
  Quiz,
  Track,
} from '@/api/schemas/content'

export interface LessonLocation {
  module: ModuleTree
  lesson: Lesson
}

export interface QuizLocation {
  module: ModuleTree
  quiz: Quiz
}

export interface PracticeSetLocation {
  module: ModuleTree
  practiceSet: Extract<ModuleItem, { kind: 'practice' }>['practiceSet']
}

export const useContentStore = defineStore('content', () => {
  const tracks = ref<Track[]>([])
  const tracksLoaded = ref(false)
  const courses = ref(new Map<string, CourseTree>())
  const dependencies = ref(new Map<string, ModuleDependency[]>())
  let tracksRequest: Promise<Track[]> | null = null
  const courseRequests = new Map<string, Promise<CourseTree>>()

  async function loadTracks(): Promise<Track[]> {
    if (tracksLoaded.value) {
      return tracks.value
    }
    if (!tracksRequest) {
      tracksRequest = listTracks()
        .then((loaded) => {
          tracks.value = loaded
          tracksLoaded.value = true
          return loaded
        })
        .finally(() => {
          tracksRequest = null
        })
    }
    return tracksRequest
  }

  async function loadCourse(slug: string): Promise<CourseTree> {
    const cached = courses.value.get(slug)
    if (cached) {
      return cached
    }
    const pending = courseRequests.get(slug)
    if (pending) {
      return pending
    }

    const request = Promise.all([getCourse(slug), listModuleDependencies(slug)])
      .then(([course, deps]) => {
        courses.value.set(slug, course)
        dependencies.value.set(slug, deps)
        return course
      })
      .finally(() => {
        courseRequests.delete(slug)
      })
    courseRequests.set(slug, request)
    return request
  }

  function courseDependencies(slug: string): ModuleDependency[] {
    return dependencies.value.get(slug) ?? []
  }

  function findLesson(
    courseSlug: string,
    moduleSlug: string,
    lessonSlug: string,
  ): LessonLocation | null {
    const course = courses.value.get(courseSlug)
    const module = course?.modules.find((item) => item.slug === moduleSlug)
    const item = module?.items.find(
      (item) => item.kind === 'lesson' && item.lesson.slug === lessonSlug,
    )
    const lesson = item?.kind === 'lesson' ? item.lesson : undefined
    return module && lesson ? { module, lesson } : null
  }

  function findQuiz(courseSlug: string, moduleSlug: string, quizSlug: string): QuizLocation | null {
    const course = courses.value.get(courseSlug)
    const module = course?.modules.find((item) => item.slug === moduleSlug)
    const item = module?.items.find((item) => item.kind === 'quiz' && item.quiz.slug === quizSlug)
    const quiz = item?.kind === 'quiz' ? item.quiz : undefined
    return module && quiz ? { module, quiz } : null
  }

  function findPracticeSet(
    courseSlug: string,
    moduleSlug: string,
    practiceSetId: string,
  ): PracticeSetLocation | null {
    const course = courses.value.get(courseSlug)
    const module = course?.modules.find((item) => item.slug === moduleSlug)
    const item = module?.items.find(
      (item) => item.kind === 'practice' && item.practiceSet.id === practiceSetId,
    )
    const practiceSet = item?.kind === 'practice' ? item.practiceSet : undefined
    return module && practiceSet ? { module, practiceSet } : null
  }

  return {
    tracks,
    courses,
    loadTracks,
    loadCourse,
    courseDependencies,
    findLesson,
    findQuiz,
    findPracticeSet,
  }
})

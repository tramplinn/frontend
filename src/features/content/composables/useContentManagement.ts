import {
  contentStatusAction,
  isPublishedModuleEmpty,
  orderedCourses,
  publishedItemCount,
  toggleContentStatus,
} from '@/features/content/model/contentTree'
import { useContentActions } from './useContentActions'
import { useContentTree } from './useContentTree'

export function useContentManagement() {
  const tree = useContentTree()
  const actions = useContentActions(tree)

  return {
    tracks: tree.tracks,
    allCourses: tree.allCourses,
    courseTrackTitles: tree.courseTrackTitles,
    openCourse: tree.openCourse,
    openSlug: tree.openSlug,
    dependencies: tree.dependencies,
    openModuleId: tree.openModuleId,
    openModule: tree.openModule,
    pending: tree.pending,
    error: tree.error,
    load: tree.load,
    busy: actions.busy,
    actionError: actions.actionError,
    publishReport: actions.publishReport,
    courseError: tree.courseError,
    loadingCourse: tree.loadingCourse,
    courseEmptyForStudents: tree.courseEmptyForStudents,
    flip: toggleContentStatus,
    publishLabel: contentStatusAction,
    publishedItems: publishedItemCount,
    isModuleEmptyForStudents: isPublishedModuleEmpty,
    ordered: orderedCourses,
    toggleCourse: tree.toggleCourse,
    refresh: tree.refresh,
    run: actions.run,
    runInTree: actions.runInTree,
    editing: actions.editing,
    toggleEditing: actions.toggleEditing,
    saveTrack: actions.saveTrack,
    saveCourse: actions.saveCourse,
    saveModule: actions.saveModule,
    addTrack: actions.addTrack,
    addCourse: actions.addCourse,
    addStandaloneCourse: actions.addStandaloneCourse,
    addModule: actions.addModule,
    addLesson: actions.addLesson,
    addPractice: actions.addPractice,
    addQuiz: actions.addQuiz,
    removeItem: actions.removeItem,
    publishItem: actions.publishItem,
    publishModuleCascade: actions.publishModuleCascade,
    publishCourseCascade: actions.publishCourseCascade,
    publishTrackCascade: actions.publishTrackCascade,
    moveModule: actions.moveModule,
    moveOpenModule: actions.moveOpenModule,
    moveItem: actions.moveItem,
    move: actions.moveCourse,
  }
}

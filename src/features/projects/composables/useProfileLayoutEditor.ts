import { ref } from 'vue'

import {
  getProfileLayout,
  listMyProjects,
  saveMyProjectsOrder,
  saveProfileLayout,
} from '@/api/projects'
import type { ProfileLayoutItem, ProjectCard } from '@/api/schemas/projects'
import { translate } from '@/i18n'
import { runBusyAction } from '@/lib/asyncAction'
import { errorText } from '@/lib/errors'
import { moved } from '@/lib/projects'

export interface ProfileProjectRow {
  project: ProjectCard
  showInProfile: boolean
}

/** Перетаскивание (нативный HTML5 DnD) и кнопки «вверх/вниз» сводятся к одному moved(). */
export function useReorder(items: { value: unknown[] }) {
  const dragging = ref<number | null>(null)

  function move(from: number, to: number): void {
    items.value = moved(items.value, from, to)
  }

  function onDragStart(index: number, event: DragEvent): void {
    dragging.value = index
    event.dataTransfer?.setData('text/plain', String(index))
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(event: DragEvent): void {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  }

  function onDrop(index: number): void {
    if (dragging.value !== null) move(dragging.value, index)
    dragging.value = null
  }

  function onDragEnd(): void {
    dragging.value = null
  }

  return { dragging, move, onDragStart, onDragOver, onDrop, onDragEnd }
}

export function useProfileLayoutEditor(onSaved: () => Promise<void> | void = () => {}) {
  const blocks = ref<ProfileLayoutItem[]>([])
  const projects = ref<ProfileProjectRow[]>([])
  const pending = ref(true)
  const loadError = ref<unknown>(null)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const saved = ref<string | null>(null)

  const blockOrder = useReorder(blocks)
  const projectOrder = useReorder(projects)

  async function load(): Promise<void> {
    pending.value = true
    loadError.value = null
    try {
      const [layout, mine] = await Promise.all([getProfileLayout(), listMyProjects()])
      blocks.value = layout
      // Порядок /me/projects — это и есть порядок в профиле; флаг показа хранит участие.
      projects.value = mine.map((project) => ({
        project,
        showInProfile: project.showInProfile ?? true,
      }))
    } catch (cause) {
      loadError.value = cause
    } finally {
      pending.value = false
    }
  }

  function toggleBlock(index: number): void {
    blocks.value = blocks.value.map((item, position) =>
      position === index ? { ...item, visible: !item.visible } : item,
    )
  }

  function toggleProject(index: number): void {
    projects.value = projects.value.map((row, position) =>
      position === index ? { ...row, showInProfile: !row.showInProfile } : row,
    )
  }

  async function save(): Promise<void> {
    saved.value = null
    await runBusyAction(
      {
        setBusy: (active) => (saving.value = active),
        clearError: () => (error.value = null),
        setError: (cause) => (error.value = errorText(cause)),
      },
      async () => {
        blocks.value = await saveProfileLayout(blocks.value)
        if (projects.value.length) {
          await saveMyProjectsOrder(
            projects.value.map((row) => ({
              projectId: row.project.id,
              showInProfile: row.showInProfile,
            })),
          )
        }
        saved.value = translate('profileLayout.saved')
        await onSaved()
      },
    )
  }

  return {
    blocks,
    projects,
    pending,
    loadError,
    saving,
    error,
    saved,
    blockOrder,
    projectOrder,
    load,
    toggleBlock,
    toggleProject,
    save,
  }
}

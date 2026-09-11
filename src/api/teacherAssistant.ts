import { snakeBody } from './case'
import { request } from './client'
import { teacherAssistantPatchSchema } from './schemas/teacherAssistant'
import type {
  TeacherAssistantDocument,
  TeacherAssistantPatch,
  TeacherAssistantSurface,
} from './schemas/teacherAssistant'

export function suggestAuthoringChanges(
  surface: TeacherAssistantSurface,
  instruction: string,
  document: TeacherAssistantDocument,
): Promise<TeacherAssistantPatch> {
  return request('/authoring/assistant/suggest', {
    method: 'POST',
    body: snakeBody({ surface, instruction, document: { ...document } }),
    schema: teacherAssistantPatchSchema,
  })
}

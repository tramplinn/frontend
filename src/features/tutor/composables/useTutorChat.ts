import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { askTutor, type TutorTurn } from '@/api/tutor'
import type { TutorEvent } from '@/api/schemas/tutor'
import { errorText } from '@/lib/errors'
import { useTutorStore } from '@/stores/tutor'

export type AskTutor = (
  id: string,
  messages: TutorTurn[],
  signal?: AbortSignal,
) => AsyncGenerator<TutorEvent>

/** contentId identifies the thread (lesson or algorithm problem); ask picks the endpoint. */
export function useTutorChat(contentId: () => string, ask: AskTutor = askTutor) {
  const tutor = useTutorStore()
  const draft = ref('')
  const streamed = ref('')
  const streaming = ref(false)
  const error = ref<string | null>(null)
  const log = ref<HTMLElement | null>(null)
  const renderer = ref<((source: string) => string) | null>(null)

  let controller: AbortController | null = null

  const turns = computed(() => tutor.turns(contentId()))
  const canSend = computed(() => draft.value.trim().length > 0 && !streaming.value)
  const answers = computed(() => {
    const render = renderer.value
    return turns.value.map((turn) =>
      turn.role === 'assistant' && render ? render(turn.content) : null,
    )
  })
  const streamedHtml = computed(() => renderer.value?.(streamed.value) ?? null)

  function loadRenderer(): void {
    if (renderer.value) return
    void import('@/lib/markdown').then((module) => {
      renderer.value = module.renderMarkdown
    })
  }

  function scrollToEnd(): void {
    void nextTick(() => {
      if (log.value) log.value.scrollTop = log.value.scrollHeight
    })
  }

  function setLog(element: Element | ComponentPublicInstance | null): void {
    log.value = element instanceof HTMLElement ? element : null
  }

  function stop(): void {
    controller?.abort()
  }

  async function send(): Promise<void> {
    const question = draft.value.trim()
    if (!question || streaming.value) return

    const targetId = contentId()
    const history: TutorTurn[] = [...tutor.turns(targetId), { role: 'user', content: question }]
    const requestController = new AbortController()
    let received = ''

    draft.value = ''
    error.value = null
    streamed.value = ''
    streaming.value = true
    controller = requestController
    tutor.setTurns(targetId, history)
    scrollToEnd()

    try {
      for await (const event of ask(targetId, history, requestController.signal)) {
        if ('delta' in event) {
          received += event.delta
          if (controller === requestController) {
            streamed.value = received
            scrollToEnd()
          }
        } else if ('error' in event && controller === requestController) {
          error.value = event.error
        }
      }
    } catch (cause) {
      if (
        controller === requestController &&
        !(cause instanceof DOMException && cause.name === 'AbortError')
      ) {
        error.value = errorText(cause)
      }
    } finally {
      if (received) {
        tutor.setTurns(targetId, [...history, { role: 'assistant', content: received }])
      }
      if (controller === requestController) {
        streamed.value = ''
        streaming.value = false
        controller = null
        scrollToEnd()
      }
    }
  }

  watch(contentId, () => {
    const previousController = controller
    previousController?.abort()
    if (controller === previousController) controller = null
    streamed.value = ''
    streaming.value = false
    error.value = null
    draft.value = ''
  })

  onBeforeUnmount(() => controller?.abort())

  return {
    answers,
    canSend,
    draft,
    error,
    loadRenderer,
    setLog,
    send,
    stop,
    streamed,
    streamedHtml,
    streaming,
    turns,
  }
}

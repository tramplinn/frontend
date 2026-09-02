import { onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentPublicInstance, Ref } from 'vue'

import type { GraphLayout, GraphNode } from '@/components/course/graph'
import { NODE_HEIGHT, NODE_WIDTH } from '@/components/course/graph'
import type { View } from '@/components/course/panZoom'
import { centerOn, fitView, panIntoView, zoomAt } from '@/components/course/panZoom'

const VIEW_PADDING = 24
const WHEEL_ZOOM_DIVISOR = 240

export function useGraphViewport(layout: Ref<GraphLayout>, currentModuleId: () => string | null) {
  const viewport = ref<HTMLElement | null>(null)
  const size = ref({ width: 0, height: 0 })
  const view = ref<View>({ x: 0, y: 0, scale: 1 })
  const panning = ref(false)
  let origin = { x: 0, y: 0, viewX: 0, viewY: 0, pointerId: -1 }
  let observer: ResizeObserver | null = null

  function fit(): void {
    view.value = fitView(
      { width: layout.value.width, height: layout.value.height },
      size.value,
      VIEW_PADDING,
    )
  }

  function showCurrent(): void {
    const node =
      layout.value.nodes.find((item) => item.id === currentModuleId()) ?? layout.value.nodes[0]
    if (!node || size.value.width === 0) return
    view.value = centerOn(
      { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEIGHT },
      size.value,
      1,
    )
  }

  function zoomBy(factor: number): void {
    view.value = zoomAt(view.value, factor, size.value.width / 2, size.value.height / 2)
  }

  function onWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const box = viewport.value?.getBoundingClientRect()
    if (!box) return
    view.value = zoomAt(
      view.value,
      Math.exp(-event.deltaY / WHEEL_ZOOM_DIVISOR),
      event.clientX - box.left,
      event.clientY - box.top,
    )
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) {
      return
    }
    panning.value = true
    origin = {
      x: event.clientX,
      y: event.clientY,
      viewX: view.value.x,
      viewY: view.value.y,
      pointerId: event.pointerId,
    }
    viewport.value?.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function onPointerMove(event: PointerEvent): void {
    if (!panning.value || event.pointerId !== origin.pointerId) return
    view.value = {
      scale: view.value.scale,
      x: origin.viewX + event.clientX - origin.x,
      y: origin.viewY + event.clientY - origin.y,
    }
  }

  function endPan(event: PointerEvent): void {
    if (!panning.value || event.pointerId !== origin.pointerId) return
    panning.value = false
    origin.pointerId = -1
    viewport.value?.releasePointerCapture(event.pointerId)
  }

  function revealNode(node: GraphNode): void {
    view.value = panIntoView(
      view.value,
      { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEIGHT },
      size.value,
      VIEW_PADDING,
    )
  }

  function setViewport(element: Element | ComponentPublicInstance | null): void {
    observer?.disconnect()
    viewport.value = element instanceof HTMLElement ? element : null
    if (!viewport.value) {
      size.value = { width: 0, height: 0 }
      return
    }
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const firstMeasurement = size.value.width === 0
      size.value = { width: entry.contentRect.width, height: entry.contentRect.height }
      if (firstMeasurement) showCurrent()
    })
    observer.observe(viewport.value)
  }

  watch(() => [currentModuleId(), layout.value.width, layout.value.height], showCurrent)
  onBeforeUnmount(() => observer?.disconnect())

  return {
    endPan,
    fit,
    onPointerDown,
    onPointerMove,
    onWheel,
    panning,
    revealNode,
    setViewport,
    showCurrent,
    view,
    zoomBy,
  }
}

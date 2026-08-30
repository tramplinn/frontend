export interface View {
  x: number
  y: number
  scale: number
}

export interface Size {
  width: number
  height: number
}

export interface Box extends Size {
  x: number
  y: number
}

export const MIN_SCALE = 0.4
export const MAX_SCALE = 1.6

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function zoomAt(view: View, factor: number, pointX: number, pointY: number): View {
  const scale = clampScale(view.scale * factor)
  const applied = scale / view.scale
  return {
    scale,
    x: pointX - (pointX - view.x) * applied,
    y: pointY - (pointY - view.y) * applied,
  }
}

export function fitView(content: Size, viewport: Size, padding: number): View {
  if (content.width <= 0 || content.height <= 0) {
    return { x: 0, y: 0, scale: 1 }
  }
  const availableWidth = Math.max(viewport.width - padding * 2, 1)
  const availableHeight = Math.max(viewport.height - padding * 2, 1)
  const scale = clampScale(
    Math.min(1, availableWidth / content.width, availableHeight / content.height),
  )
  return {
    scale,
    x: (viewport.width - content.width * scale) / 2,
    y: (viewport.height - content.height * scale) / 2,
  }
}

export function centerOn(box: Box, viewport: Size, scale: number): View {
  return {
    scale,
    x: viewport.width / 2 - (box.x + box.width / 2) * scale,
    y: viewport.height / 2 - (box.y + box.height / 2) * scale,
  }
}

export function offsetToShow(
  start: number,
  size: number,
  viewport: number,
  padding: number,
): number {
  let delta = 0
  const end = start + size
  if (end > viewport - padding) {
    delta = viewport - padding - end
  }
  if (start + delta < padding) {
    delta = padding - start
  }
  return delta
}

export function panIntoView(view: View, box: Box, viewport: Size, padding: number): View {
  return {
    scale: view.scale,
    x:
      view.x +
      offsetToShow(view.x + box.x * view.scale, box.width * view.scale, viewport.width, padding),
    y:
      view.y +
      offsetToShow(view.y + box.y * view.scale, box.height * view.scale, viewport.height, padding),
  }
}

import type { ModuleDependency, ModuleTree } from '@/api/schemas/content'

export interface GraphNode {
  id: string
  title: string
  slug: string
  layer: number
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
  path: string
}

export interface GraphLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width: number
  height: number
}

export const NODE_WIDTH = 224
export const NODE_HEIGHT = 88
const GAP_X = 28
const GAP_Y = 64
const CORNER = 10

/** Место в ряду. Кроме модулей ряды занимают пустые дорожки для длинных связей:
    без своего слота связь пересекла бы карточку промежуточного слоя. */
interface Slot {
  id: string
  layer: number
  order: number
  module: ModuleTree | null
  x: number
}

interface Link {
  from: string
  to: string
}

interface Point {
  x: number
  y: number
}

/** Слой модуля — длина самого длинного пути из модулей без зависимостей. */
function computeLayers(
  moduleIds: Set<string>,
  requirements: Map<string, string[]>,
): Map<string, number> {
  const layers = new Map<string, number>()
  const visiting = new Set<string>()

  const resolve = (id: string): number => {
    const known = layers.get(id)
    if (known !== undefined) {
      return known
    }
    // Бэкенд не даёт замкнуть цикл, но раскладка не должна зависеть от этого.
    if (visiting.has(id)) {
      return 0
    }
    visiting.add(id)
    const deps = requirements.get(id) ?? []
    const depth = deps.reduce(
      (max, dep) => (moduleIds.has(dep) ? Math.max(max, resolve(dep) + 1) : max),
      0,
    )
    visiting.delete(id)
    layers.set(id, depth)
    return depth
  }

  for (const id of moduleIds) {
    resolve(id)
  }
  return layers
}

function layerY(layer: number): number {
  return layer * (NODE_HEIGHT + GAP_Y)
}

const round = (value: number): string => String(Math.round(value * 100) / 100)

/** Прямая вниз, если колонка та же, иначе поворот между слоями, ход вбок,
    поворот обратно: диагонали на такой сетке читаются как спутанные. */
function segment(from: Point, to: Point): string {
  if (Math.abs(from.x - to.x) < 1) {
    return ` L ${round(from.x)} ${round(to.y)}`
  }
  const midY = (from.y + to.y) / 2
  const radius = Math.min(CORNER, Math.abs(to.x - from.x) / 2, Math.abs(midY - from.y))
  const side = to.x > from.x ? 1 : -1
  return [
    ` L ${round(from.x)} ${round(midY - radius)}`,
    `Q ${round(from.x)} ${round(midY)} ${round(from.x + side * radius)} ${round(midY)}`,
    `L ${round(to.x - side * radius)} ${round(midY)}`,
    `Q ${round(to.x)} ${round(midY)} ${round(to.x)} ${round(midY + radius)}`,
    `L ${round(to.x)} ${round(to.y)}`,
  ].join(' ')
}

function pathThrough(points: Point[]): string {
  const [head, ...rest] = points
  if (!head) {
    return ''
  }
  let path = `M ${round(head.x)} ${round(head.y)}`
  let previous = head
  for (const point of rest) {
    path += segment(previous, point)
    previous = point
  }
  return path
}

/** Порядок мест внутри слоя. Позиция автора — про оглавление, а не про раскладку,
    поэтому несколько проходов барицентром подтягивают место к середине соседей:
    связи становятся короткими и перестают пересекаться. */
function orderRows(
  rows: Map<number, Slot[]>,
  requirements: Map<string, string[]>,
  dependents: Map<string, string[]>,
): void {
  const layers = [...rows.keys()].sort((a, b) => a - b)
  for (const layer of layers) {
    rows.get(layer)?.sort((a, b) => a.order - b.order)
  }

  const sweep = (layer: number, neighbours: Map<string, string[]>, reference: number): void => {
    const row = rows.get(layer)
    const referenceRow = rows.get(reference)
    if (!row || !referenceRow) {
      return
    }
    const positions = new Map(referenceRow.map((slot, index) => [slot.id, index]))
    const barycentre = new Map<string, number>()
    row.forEach((slot, index) => {
      const linked = (neighbours.get(slot.id) ?? [])
        .map((id) => positions.get(id))
        .filter((value): value is number => value !== undefined)
      // Место без соседей в опорном слое остаётся где было, а не уезжает в начало.
      const centre =
        linked.length === 0 ? index : linked.reduce((sum, value) => sum + value, 0) / linked.length
      barycentre.set(slot.id, centre)
    })
    row.sort((a, b) => (barycentre.get(a.id) ?? 0) - (barycentre.get(b.id) ?? 0))
  }

  // Проходы вниз и вверх чередуются: порядок должен устраивать оба соседних слоя.
  const SWEEPS = 4
  for (let pass = 0; pass < SWEEPS; pass += 1) {
    for (let index = 1; index < layers.length; index += 1) {
      const layer = layers[index]
      const previous = layers[index - 1]
      if (layer !== undefined && previous !== undefined) {
        sweep(layer, requirements, previous)
      }
    }
    for (let index = layers.length - 2; index >= 0; index -= 1) {
      const layer = layers[index]
      const next = layers[index + 1]
      if (layer !== undefined && next !== undefined) {
        sweep(layer, dependents, next)
      }
    }
  }
}

export function layoutGraph(modules: ModuleTree[], dependencies: ModuleDependency[]): GraphLayout {
  if (modules.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 }
  }

  const moduleIds = new Set(modules.map((module) => module.id))
  const real = dependencies.filter(
    (edge) => moduleIds.has(edge.moduleId) && moduleIds.has(edge.dependsOnId),
  )

  const requirements = new Map<string, string[]>()
  for (const edge of real) {
    requirements.set(edge.moduleId, [...(requirements.get(edge.moduleId) ?? []), edge.dependsOnId])
  }
  const layers = computeLayers(moduleIds, requirements)

  const slots = new Map<string, Slot>()
  for (const module of modules) {
    const layer = layers.get(module.id) ?? 0
    slots.set(module.id, { id: module.id, layer, order: module.position, module, x: 0 })
  }

  // Длинная связь разбивается на цепочку: в каждом промежуточном слое ей
  // отводится своя пустая дорожка.
  const chains = new Map<string, string[]>()
  const links: Link[] = []
  for (const edge of real) {
    const fromLayer = layers.get(edge.dependsOnId) ?? 0
    const toLayer = layers.get(edge.moduleId) ?? 0
    const chain = [edge.dependsOnId]
    for (let layer = fromLayer + 1; layer < toLayer; layer += 1) {
      const id = `lane:${edge.dependsOnId}:${edge.moduleId}:${String(layer)}`
      slots.set(id, {
        id,
        layer,
        order: slots.get(edge.dependsOnId)?.order ?? 0,
        module: null,
        x: 0,
      })
      chain.push(id)
    }
    chain.push(edge.moduleId)
    chains.set(`${edge.dependsOnId}->${edge.moduleId}`, chain)
    for (let index = 1; index < chain.length; index += 1) {
      const from = chain[index - 1]
      const to = chain[index]
      if (from !== undefined && to !== undefined) {
        links.push({ from, to })
      }
    }
  }

  const linkRequirements = new Map<string, string[]>()
  const linkDependents = new Map<string, string[]>()
  for (const link of links) {
    linkRequirements.set(link.to, [...(linkRequirements.get(link.to) ?? []), link.from])
    linkDependents.set(link.from, [...(linkDependents.get(link.from) ?? []), link.to])
  }

  const rows = new Map<number, Slot[]>()
  for (const slot of slots.values()) {
    rows.set(slot.layer, [...(rows.get(slot.layer) ?? []), slot])
  }

  orderRows(rows, linkRequirements, linkDependents)

  const widest = Math.max(...[...rows.values()].map((row) => row.length))
  const width = widest * NODE_WIDTH + (widest - 1) * GAP_X

  for (const row of rows.values()) {
    const rowWidth = row.length * NODE_WIDTH + (row.length - 1) * GAP_X
    const offset = (width - rowWidth) / 2
    row.forEach((slot, index) => {
      slot.x = offset + index * (NODE_WIDTH + GAP_X)
    })
  }

  const nodes: GraphNode[] = []
  for (const [layer, row] of [...rows.entries()].sort(([a], [b]) => a - b)) {
    for (const slot of row) {
      if (slot.module) {
        nodes.push({
          id: slot.id,
          title: slot.module.title,
          slug: slot.module.slug,
          layer,
          x: slot.x,
          y: layerY(layer),
        })
      }
    }
  }

  const centre = (slot: Slot): number => slot.x + NODE_WIDTH / 2
  const edges: GraphEdge[] = []
  for (const edge of real) {
    const chain = chains.get(`${edge.dependsOnId}->${edge.moduleId}`)
    const source = slots.get(edge.dependsOnId)
    const target = slots.get(edge.moduleId)
    if (!chain || !source || !target) {
      continue
    }
    const points: Point[] = [{ x: centre(source), y: layerY(source.layer) + NODE_HEIGHT }]
    for (const id of chain.slice(1, -1)) {
      const lane = slots.get(id)
      if (lane) {
        // Дорожка проходится насквозь по вертикали — там гарантированно пусто.
        points.push({ x: centre(lane), y: layerY(lane.layer) })
        points.push({ x: centre(lane), y: layerY(lane.layer) + NODE_HEIGHT })
      }
    }
    points.push({ x: centre(target), y: layerY(target.layer) })
    edges.push({ from: edge.dependsOnId, to: edge.moduleId, path: pathThrough(points) })
  }

  const depth = Math.max(...nodes.map((node) => node.y)) + NODE_HEIGHT
  return { nodes, edges, width, height: depth }
}

export function neighbourhood(edges: GraphEdge[], nodeId: string): Set<string> {
  const related = new Set<string>([nodeId])
  for (const edge of edges) {
    if (edge.from === nodeId) {
      related.add(edge.to)
    }
    if (edge.to === nodeId) {
      related.add(edge.from)
    }
  }
  return related
}

import { describe, expect, it } from 'vitest'

import type { ModuleTree } from '@/api/schemas/content'
import { NODE_WIDTH, layoutGraph } from '../graph'

function makeModule(id: string, position: number): ModuleTree {
  return {
    id,
    title: `Модуль ${id}`,
    slug: id,
    position,
    courseId: 'course',
    summary: null,
    status: 'published',
    items: [],
  }
}

const layerOf = (nodes: { id: string; layer: number }[], id: string): number | undefined =>
  nodes.find((node) => node.id === id)?.layer

describe('layoutGraph', () => {
  it('раскладывает ромб по длиннейшему пути', () => {
    const modules = ['a', 'b', 'c', 'd'].map((id, index) => makeModule(id, index))
    const { nodes, edges } = layoutGraph(modules, [
      { moduleId: 'b', dependsOnId: 'a' },
      { moduleId: 'c', dependsOnId: 'a' },
      { moduleId: 'd', dependsOnId: 'b' },
      { moduleId: 'd', dependsOnId: 'c' },
    ])

    expect(layerOf(nodes, 'a')).toBe(0)
    expect(layerOf(nodes, 'b')).toBe(1)
    expect(layerOf(nodes, 'c')).toBe(1)
    expect(layerOf(nodes, 'd')).toBe(2)
    expect(edges).toHaveLength(4)
  })

  it('центрирует неполный ряд относительно самого широкого', () => {
    const modules = ['a', 'b', 'c'].map((id, index) => makeModule(id, index))
    const { nodes, width } = layoutGraph(modules, [
      { moduleId: 'b', dependsOnId: 'a' },
      { moduleId: 'c', dependsOnId: 'a' },
    ])

    const single = nodes.find((node) => node.id === 'a')
    expect(single?.x).toBe((width - NODE_WIDTH) / 2)
  })

  it('переставляет ряд так, чтобы связи не пересекались', () => {
    const { nodes } = layoutGraph(
      [makeModule('a', 0), makeModule('b', 1), makeModule('c', 2), makeModule('d', 3)],
      [
        { moduleId: 'c', dependsOnId: 'b' },
        { moduleId: 'd', dependsOnId: 'a' },
      ],
    )

    const x = (id: string): number => nodes.find((node) => node.id === id)?.x ?? Number.NaN
    expect(x('a')).toBeLessThan(x('b'))
    expect(x('d')).toBeLessThan(x('c'))
    expect(x('d')).toBe(x('a'))
    expect(x('c')).toBe(x('b'))
  })

  it('ведёт ребро прямыми углами, а не диагональю', () => {
    const { edges } = layoutGraph(
      [makeModule('a', 0), makeModule('b', 1), makeModule('c', 2)],
      [
        { moduleId: 'b', dependsOnId: 'a' },
        { moduleId: 'c', dependsOnId: 'a' },
      ],
    )

    expect(edges.every((edge) => edge.path.startsWith('M '))).toBe(true)
    expect(edges.some((edge) => edge.path.includes('Q '))).toBe(true)
    expect(edges.every((edge) => !edge.path.includes('C '))).toBe(true)
  })

  it('отводит дорожку связи, перепрыгивающей через слой', () => {
    const { nodes, width } = layoutGraph(
      [makeModule('a', 0), makeModule('b', 1), makeModule('c', 2)],
      [
        { moduleId: 'b', dependsOnId: 'a' },
        { moduleId: 'c', dependsOnId: 'b' },
        { moduleId: 'c', dependsOnId: 'a' },
      ],
    )

    expect(width).toBe(NODE_WIDTH * 2 + 28)
    expect(nodes).toHaveLength(3)
    const b = nodes.find((node) => node.id === 'b')
    expect(b?.x).not.toBe((width - NODE_WIDTH) / 2)
    expect([0, NODE_WIDTH + 28]).toContain(b?.x)
  })

  it('кладёт модули без зависимостей в один слой', () => {
    const { nodes } = layoutGraph(
      ['x', 'y'].map((id, index) => makeModule(id, index)),
      [],
    )
    expect(nodes.every((node) => node.layer === 0)).toBe(true)
  })

  it('не падает на курсе без модулей', () => {
    expect(layoutGraph([], [])).toEqual({ nodes: [], edges: [], width: 0, height: 0 })
  })

  it('игнорирует ребро на модуль вне курса', () => {
    const { nodes, edges } = layoutGraph(
      [makeModule('a', 0)],
      [{ moduleId: 'a', dependsOnId: 'ghost' }],
    )
    expect(edges).toHaveLength(0)
    expect(layerOf(nodes, 'a')).toBe(0)
  })

  it('не зацикливается на циклическом графе', () => {
    // Бэкенд не даёт замкнуть цикл, но раскладка не должна на этом виснуть.
    const { nodes } = layoutGraph(
      ['p', 'q'].map((id, index) => makeModule(id, index)),
      [
        { moduleId: 'p', dependsOnId: 'q' },
        { moduleId: 'q', dependsOnId: 'p' },
      ],
    )
    expect(nodes).toHaveLength(2)
  })
})

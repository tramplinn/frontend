import { describe, expect, it } from 'vitest'

import {
  MAX_SCALE,
  MIN_SCALE,
  centerOn,
  clampScale,
  fitView,
  offsetToShow,
  panIntoView,
  zoomAt,
} from '../panZoom'

describe('clampScale', () => {
  it('оставляет масштаб внутри границ', () => {
    expect(clampScale(10)).toBe(MAX_SCALE)
    expect(clampScale(0.01)).toBe(MIN_SCALE)
    expect(clampScale(1)).toBe(1)
  })
})

describe('zoomAt', () => {
  it('оставляет точку под курсором на месте', () => {
    const view = { x: -120, y: -40, scale: 1 }
    const pointX = 300
    const pointY = 200
    const contentX = (pointX - view.x) / view.scale
    const contentY = (pointY - view.y) / view.scale

    const zoomed = zoomAt(view, 1.25, pointX, pointY)

    expect(zoomed.x + contentX * zoomed.scale).toBeCloseTo(pointX)
    expect(zoomed.y + contentY * zoomed.scale).toBeCloseTo(pointY)
  })

  it('не двигает холст, когда масштаб упёрся в предел', () => {
    const view = { x: 10, y: 20, scale: MAX_SCALE }
    expect(zoomAt(view, 2, 100, 100)).toEqual(view)
  })
})

describe('fitView', () => {
  it('вписывает крупное содержимое и центрирует его', () => {
    const view = fitView({ width: 1000, height: 500 }, { width: 600, height: 400 }, 20)

    expect(view.scale).toBeCloseTo(0.56)
    expect(view.x).toBeCloseTo((600 - 1000 * view.scale) / 2)
    expect(view.y).toBeCloseTo((400 - 500 * view.scale) / 2)
  })

  it('не увеличивает мелкое содержимое крупнее 1:1', () => {
    expect(fitView({ width: 100, height: 50 }, { width: 600, height: 400 }, 20).scale).toBe(1)
  })

  it('переживает пустую раскладку', () => {
    expect(fitView({ width: 0, height: 0 }, { width: 600, height: 400 }, 20)).toEqual({
      x: 0,
      y: 0,
      scale: 1,
    })
  })
})

describe('centerOn', () => {
  it('ставит середину прямоугольника в середину окна', () => {
    const view = centerOn(
      { x: 200, y: 600, width: 224, height: 88 },
      { width: 800, height: 400 },
      1,
    )

    expect(view.x + (200 + 112) * 1).toBe(400)
    expect(view.y + (600 + 44) * 1).toBe(200)
    expect(view.scale).toBe(1)
  })

  it('учитывает масштаб', () => {
    const view = centerOn(
      { x: 100, y: 100, width: 200, height: 100 },
      { width: 600, height: 300 },
      0.5,
    )

    expect(view.x + (100 + 100) * 0.5).toBe(300)
    expect(view.y + (100 + 50) * 0.5).toBe(150)
  })
})

describe('offsetToShow', () => {
  it('не двигает то, что уже видно целиком', () => {
    expect(offsetToShow(50, 100, 400, 16)).toBe(0)
  })

  it('подтягивает вышедшее за дальний край', () => {
    expect(offsetToShow(350, 100, 400, 16)).toBe(-66)
  })

  it('подтягивает вышедшее за ближний край', () => {
    expect(offsetToShow(-30, 100, 400, 16)).toBe(46)
  })

  it('показывает начало, если отрезок длиннее окна', () => {
    expect(offsetToShow(-50, 900, 400, 16)).toBe(66)
  })
})

describe('panIntoView', () => {
  it('доводит узел за краем окна до видимости с учётом масштаба', () => {
    const view = { x: 0, y: 0, scale: 0.5 }
    const moved = panIntoView(
      view,
      { x: 900, y: 0, width: 200, height: 80 },
      { width: 400, height: 300 },
      16,
    )

    expect(moved.scale).toBe(0.5)
    expect(moved.x + 900 * 0.5).toBeLessThanOrEqual(400 - 16)
    expect(moved.x + (900 + 200) * 0.5).toBeCloseTo(400 - 16)
    expect(moved.y).toBe(16)
  })
})

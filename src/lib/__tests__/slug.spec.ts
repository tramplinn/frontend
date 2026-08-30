import { describe, expect, it } from 'vitest'

import { slugify } from '../slug'

describe('slugify', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugify('Основы веба')).toBe('osnovy-veba')
    expect(slugify('Проверка связей')).toBe('proverka-svyazei')
  })

  it('схлопывает разделители и обрезает края', () => {
    expect(slugify('  Тест —— первый!  ')).toBe('test-pervyi')
  })

  it('выбрасывает мягкий и твёрдый знаки', () => {
    expect(slugify('Объявление')).toBe('obyavlenie')
    expect(slugify('День')).toBe('den')
  })

  it('оставляет латиницу и цифры как есть', () => {
    expect(slugify('HTTP/1.1 и REST')).toBe('http-1-1-i-rest')
  })

  it('укладывается в ограничение длины', () => {
    expect(slugify('а'.repeat(200))).toHaveLength(120)
  })
})

import { describe, expect, it } from 'vitest'

import { dataOf, readSseData } from '../sse'

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const out: string[] = []
  for await (const data of readSseData(stream)) {
    out.push(data)
  }
  return out
}

describe('dataOf', () => {
  it('берёт содержимое поля data', () => {
    expect(dataOf('data: {"delta":"а"}')).toBe('{"delta":"а"}')
  })

  it('склеивает многострочное data переводом строки', () => {
    expect(dataOf('data: первая\ndata: вторая')).toBe('первая\nвторая')
  })

  it('пропускает события без data — комментарии и служебные поля', () => {
    expect(dataOf(': keep-alive')).toBeNull()
    expect(dataOf('event: ping')).toBeNull()
  })
})

describe('readSseData', () => {
  it('разбирает несколько событий из одного куска', async () => {
    const events = await collect(streamOf('data: раз\n\ndata: два\n\n'))

    expect(events).toEqual(['раз', 'два'])
  })

  it('собирает событие, разорванное на границе куска', async () => {
    const events = await collect(streamOf('data: пер', 'вое\n', '\ndata: второе\n\n'))

    expect(events).toEqual(['первое', 'второе'])
  })

  it('не отдаёт незавершённое событие в хвосте потока', async () => {
    const events = await collect(streamOf('data: целое\n\ndata: обрыв'))

    expect(events).toEqual(['целое'])
  })

  it('переживает многобайтовый символ, разрезанный между кусками', async () => {
    const encoded = new TextEncoder().encode('data: щ\n\n')
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded.slice(0, 7))
        controller.enqueue(encoded.slice(7))
        controller.close()
      },
    })

    expect(await collect(stream)).toEqual(['щ'])
  })
})

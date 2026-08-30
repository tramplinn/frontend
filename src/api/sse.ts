export async function* readSseData(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const data = dataOf(chunk)
        if (data !== null) {
          yield data
        }
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function dataOf(chunk: string): string | null {
  const parts: string[] = []
  for (const line of chunk.split('\n')) {
    if (line.startsWith('data:')) {
      parts.push(line.slice('data:'.length).trimStart())
    }
  }
  return parts.length > 0 ? parts.join('\n') : null
}

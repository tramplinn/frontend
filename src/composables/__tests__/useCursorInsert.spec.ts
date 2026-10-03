import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useCursorInsert } from '@/composables/useCursorInsert'

describe('useCursorInsert', () => {
  it('подставляет markdown буквально, даже если в нём есть $-шаблоны замены', () => {
    const text = ref('до ![загрузка a.png]() после')
    const { replacePlaceholder } = useCursorInsert(
      ref(null),
      () => text.value,
      (value) => (text.value = value),
    )
    replacePlaceholder('![загрузка a.png]()', '![цена $$ и $&](https://cdn.test/a.png)')
    expect(text.value).toBe('до ![цена $$ и $&](https://cdn.test/a.png) после')
  })
})

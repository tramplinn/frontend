/** Сравнение идёт по значению варианта, поэтому value сохраняем как есть. */
export interface QuizOption {
  value: unknown
  label: string
  key: string
}

function isLabelled(value: object): value is { value: unknown; label: string } {
  return (
    'value' in value && 'label' in value && typeof (value as { label: unknown }).label === 'string'
  )
}

/** Формат, в котором MCP-сервер присылает варианты single/multiple вопросов: `{id, label}`. */
function isIdentified(value: object): value is { id: unknown; label: string } {
  return 'id' in value && 'label' in value && typeof (value as { label: unknown }).label === 'string'
}

export function normalizeOptions(options: unknown[]): QuizOption[] {
  return options.map((option, index) => {
    if (typeof option === 'string') {
      return { value: option, label: option, key: `${String(index)}:${option}` }
    }
    if (typeof option === 'object' && option !== null) {
      if (isLabelled(option)) {
        return { value: option.value, label: option.label, key: `${String(index)}:${option.label}` }
      }
      if (isIdentified(option)) {
        return { value: option.id, label: option.label, key: `${String(index)}:${option.label}` }
      }
    }
    const label = JSON.stringify(option)
    return { value: option, label, key: `${String(index)}:${label}` }
  })
}

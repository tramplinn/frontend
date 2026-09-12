import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export interface EditorField<TDraft> {
  key: keyof TDraft
  label: string
  model: Ref<string>
  width?: 'wide' | 'narrow'
  multiline?: boolean
  rows?: number
  mono?: boolean
  autoHeight?: boolean
  placeholder?: string
  inputmode?: 'numeric'
  toValue: (raw: string) => TDraft[keyof TDraft]
}

export function useEntityForm<TDraft>(
  title: Ref<string>,
  slug: Ref<string>,
  fields: EditorField<TDraft>[],
): { valid: ComputedRef<boolean>; buildPatch: () => Partial<TDraft>; dirty: ComputedRef<boolean> } {
  const initialTitle = title.value
  const initialSlug = slug.value
  const initialFieldValues = fields.map((field) => field.model.value)

  const valid = computed(() => title.value.trim().length > 0 && slug.value.trim().length > 0)

  const dirty = computed(
    () =>
      title.value !== initialTitle ||
      slug.value !== initialSlug ||
      fields.some((field, index) => field.model.value !== initialFieldValues[index]),
  )

  function buildPatch(): Partial<TDraft> {
    const patch = {} as Partial<TDraft>
    for (const field of fields) {
      patch[field.key] = field.toValue(field.model.value)
    }
    return patch
  }

  return { valid, buildPatch, dirty }
}

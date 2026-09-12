<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{ modelValue: string; length?: number; disabled?: boolean; autofocus?: boolean }>(),
  { length: 6, disabled: false, autofocus: false },
)

const emit = defineEmits<{ 'update:modelValue': [string]; complete: [string] }>()

function splitValue(value: string): string[] {
  const chars = value.replace(/\D/g, '').slice(0, props.length).split('')
  return Array.from({ length: props.length }, (_, index) => chars[index] ?? '')
}

const digits = ref<string[]>(splitValue(props.modelValue))
const cells = ref<(HTMLInputElement | null)[]>([])

watch(
  () => props.modelValue,
  (value) => {
    if (value === digits.value.join('')) return
    digits.value = splitValue(value)
  },
)

function emitValue(): void {
  const value = digits.value.join('')
  emit('update:modelValue', value)
  if (value.length === props.length && !value.includes('')) emit('complete', value)
}

function focusCell(index: number): void {
  const target = Math.min(Math.max(index, 0), props.length - 1)
  void nextTick(() => cells.value[target]?.focus())
}

function fillFrom(index: number, chars: string[]): void {
  let cursor = index
  for (const char of chars) {
    if (cursor >= props.length) break
    digits.value[cursor] = char
    cursor += 1
  }
  emitValue()
  focusCell(cursor)
}

function onInput(index: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  if (!raw) {
    digits.value[index] = ''
    target.value = ''
    emitValue()
    return
  }
  fillFrom(index, raw.split(''))
}

function onKeydown(index: number, event: KeyboardEvent): void {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    event.preventDefault()
    digits.value[index - 1] = ''
    emitValue()
    focusCell(index - 1)
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusCell(index - 1)
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault()
    focusCell(index + 1)
  }
}

function onPaste(index: number, event: ClipboardEvent): void {
  const text = event.clipboardData?.getData('text') ?? ''
  const chars = text.replace(/\D/g, '').split('')
  if (!chars.length) return
  event.preventDefault()
  fillFrom(index, chars)
}

function onFocus(event: FocusEvent): void {
  ;(event.target as HTMLInputElement).select()
}

if (props.autofocus) focusCell(0)
</script>

<template>
  <div class="otp" role="group" aria-label="код из письма">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(el) => (cells[index] = el as HTMLInputElement | null)"
      :value="digit"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      class="otp-cell"
      :disabled="disabled"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste(index, $event)"
      @focus="onFocus"
    />
  </div>
</template>

<style scoped>
.otp {
  display: flex;
  gap: var(--space-2);
}

.otp-cell {
  width: var(--ctl-md);
  height: var(--ctl-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  text-align: center;
}

.otp-cell:focus {
  border-color: var(--accent);
  outline: none;
}

.otp-cell:disabled {
  opacity: 0.5;
}
</style>

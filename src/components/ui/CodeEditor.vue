<script setup lang="ts">
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import {
  HighlightStyle,
  StreamLanguage,
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { csharp, kotlin } from '@codemirror/legacy-modes/mode/clike'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  highlightActiveLine as activeLineHighlight,
  highlightActiveLineGutter as activeLineGutterHighlight,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: string
    readonly?: boolean
    minHeight?: string
    ariaLabel?: string
    highlightActiveLine?: boolean
  }>(),
  {
    language: 'python',
    readonly: false,
    minHeight: '420px',
    ariaLabel: 'Редактор кода',
    highlightActiveLine: true,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const host = shallowRef<HTMLDivElement | null>(null)
const view = shallowRef<EditorView | null>(null)
const languageSlot = new Compartment()
const readonlySlot = new Compartment()

/** Цвета берутся из токенов темы, поэтому подсветка сама следует за светлой/тёмной. */
const highlight = HighlightStyle.define([
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--code-comment)' },
  {
    tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword, tags.modifier, tags.self],
    color: 'var(--code-keyword)',
  },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: 'var(--code-string)' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: 'var(--code-number)' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: 'var(--code-function)' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: 'var(--code-type)' },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: 'var(--code-operator)' },
  { tag: [tags.variableName, tags.propertyName], color: 'var(--code-name)' },
  { tag: tags.invalid, color: 'var(--code-invalid)' },
])

const theme = EditorView.theme({
  '&': {
    color: 'var(--text)',
    backgroundColor: 'var(--bg)',
    borderRadius: 'var(--radius-ctl)',
    border: '1px solid var(--border)',
    fontSize: 'var(--text-input)',
  },
  '&.cm-focused': { outline: '2px solid var(--accent)', outlineOffset: '-1px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-content': { padding: 'var(--space-3) 0', caretColor: 'var(--text)' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--code-gutter)',
    border: 'none',
    paddingLeft: 'var(--space-2)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--code-active-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-muted)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--code-selection)',
  },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--accent-soft)',
    color: 'inherit',
    outline: '1px solid var(--accent)',
  },
})

function languageExtension(key: string) {
  switch (key) {
    case 'javascript':
      return javascript()
    case 'typescript':
      return javascript({ typescript: true })
    case 'cpp':
      return cpp()
    case 'java':
      return java()
    case 'go':
      return go()
    case 'csharp':
      return StreamLanguage.define(csharp)
    case 'kotlin':
      return StreamLanguage.define(kotlin)
    default:
      return python()
  }
}

onMounted(() => {
  if (!host.value) {
    return
  }
  view.value = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        ...(props.highlightActiveLine
          ? [activeLineHighlight(), activeLineGutterHighlight()]
          : []),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        syntaxHighlighting(highlight),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        theme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ 'aria-label': props.ariaLabel }),
        languageSlot.of(languageExtension(props.language)),
        readonlySlot.of(EditorState.readOnly.of(props.readonly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
      ],
    }),
  })
})

onBeforeUnmount(() => {
  view.value?.destroy()
  view.value = null
})

// Внешняя смена значения (шаблон другого языка, сброс) — заменяем документ целиком.
// Сравнение обязательно: без него каждый ввод отправлял бы курсор в конец текста.
watch(
  () => props.modelValue,
  (value) => {
    const current = view.value
    if (current && value !== current.state.doc.toString()) {
      current.dispatch({
        changes: { from: 0, to: current.state.doc.length, insert: value },
      })
    }
  },
)

watch(
  () => props.language,
  (value) => {
    view.value?.dispatch({ effects: languageSlot.reconfigure(languageExtension(value)) })
  },
)

watch(
  () => props.readonly,
  (value) => {
    view.value?.dispatch({ effects: readonlySlot.reconfigure(EditorState.readOnly.of(value)) })
  },
)
</script>

<template>
  <div ref="host" class="editor" :style="{ '--editor-min-height': props.minHeight }" />
</template>

<style scoped>
.editor :deep(.cm-editor) {
  min-height: var(--editor-min-height);
}

.editor :deep(.cm-scroller) {
  overflow: auto;
}
</style>

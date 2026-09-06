<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui'
import { onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{ danger?: boolean; disabled?: boolean; confirmLabel?: string }>(),
  { danger: false, disabled: false, confirmLabel: 'точно удалить?' },
)

const emit = defineEmits<{ select: [] }>()

const armed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

/** Как в ConfirmButton: взведённое состояние само гаснет через 4с, иначе
    пункт остаётся готов удалить с одного клика, пока меню не закрыто. */
function select(event: Event): void {
  if (!props.danger || armed.value) {
    clearTimeout(timer)
    armed.value = false
    emit('select')
    return
  }
  event.preventDefault()
  armed.value = true
  timer = setTimeout(() => (armed.value = false), 4000)
}

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <DropdownMenuItem
    class="item"
    :class="{ 'item--danger': props.danger, 'item--armed': armed }"
    :disabled="props.disabled"
    @select="select"
  >
    <template v-if="armed">{{ props.confirmLabel }}</template>
    <slot v-else />
  </DropdownMenuItem>
</template>

<style scoped>
.item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  cursor: pointer;
  outline: none;
}

.item[data-highlighted] {
  background: var(--surface);
}

.item[data-disabled] {
  color: var(--text-muted);
  opacity: 0.5;
  cursor: default;
}

.item--danger {
  color: var(--danger);
}

/* Двойной класс, чтобы взведённое состояние гарантированно перебивало
   подсветку Reka, а не полагалось на порядок правил. */
.item.item--armed,
.item.item--armed[data-highlighted] {
  background: var(--danger);
  color: var(--on-danger);
  font-weight: var(--weight-medium);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'md' | 'sm'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'secondary', size: 'md', disabled: false, loading: false, type: 'button' },
)

const isBlocked = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    :type="props.type"
    :class="['btn', `btn--${props.variant}`, `btn--${props.size}`]"
    :disabled="isBlocked"
    :aria-busy="props.loading"
  >
    <span v-if="props.loading" class="spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius-ctl);
  font-weight: var(--weight-medium);
  cursor: pointer;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn--md {
  height: var(--ctl-md);
  padding: 0 var(--space-6);
  font-size: var(--text-body);
}

.btn--sm {
  height: var(--ctl-sm);
  padding: 0 var(--space-4);
  font-size: var(--text-caption);
}

.btn--primary {
  background: var(--accent);
  color: var(--on-accent);
}

.btn--primary:not(:disabled):hover {
  background: var(--accent-hover);
}

.btn--secondary {
  background: var(--surface);
  color: var(--text);
}

.btn--secondary:not(:disabled):hover {
  background: var(--surface-hover);
}

.btn--quiet {
  background: transparent;
  color: var(--text-muted);
}

.btn--danger {
  background: var(--danger);
  color: var(--on-danger);
}

.btn--danger:not(:disabled):hover {
  filter: brightness(1.06);
}

.btn--quiet:not(:disabled):hover {
  color: var(--text);
}

.spinner {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-pill);
  opacity: 0.7;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

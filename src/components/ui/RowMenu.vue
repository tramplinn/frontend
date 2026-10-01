<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{ label?: string | undefined; disabled?: boolean }>(), {
  label: undefined,
  disabled: false,
})
</script>

<template>
  <!-- Обёртка нужна как корневой элемент: DropdownMenuRoot ничего не рендерит,
       и класс с места вызова во фрагмент не пробрасывается. -->
  <div class="row-menu">
    <DropdownMenuRoot>
      <DropdownMenuTrigger
        class="trigger"
        :aria-label="props.label ?? t('ui.actions')"
        :disabled="props.disabled"
      >
        <svg width="16" height="4" viewBox="0 0 16 4" aria-hidden="true">
          <circle cx="2" cy="2" r="1.6" />
          <circle cx="8" cy="2" r="1.6" />
          <circle cx="14" cy="2" r="1.6" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent class="row-menu-surface" :side-offset="4" align="end">
          <slot />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>

<style scoped>
.row-menu {
  flex-shrink: 0;
  line-height: 0;
}

.trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease),
    color var(--motion-fast) var(--ease);
}

.trigger svg {
  fill: currentColor;
}

.trigger:hover,
.trigger[data-state='open'] {
  background: var(--surface-hover);
  color: var(--text);
}

.trigger:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>

<!-- Содержимое уходит в портал на body и теряет scope-идентификатор, поэтому
     поверхность меню стилизуется глобально. Имя класса уникально, чтобы
     глобальное правило ни с чем не пересеклось. -->
<style>
.row-menu-surface {
  min-width: 176px;
  padding: var(--space-2);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  box-shadow: var(--shadow-raised);
}
</style>

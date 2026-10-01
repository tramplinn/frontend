<script setup lang="ts">
import { useI18n } from '@/i18n'

const { t } = useI18n()

withDefaults(
  defineProps<{
    sheetPadding?: 'regular' | 'compact'
    prioritizeRailEndOnMobile?: boolean
  }>(),
  { sheetPadding: 'regular', prioritizeRailEndOnMobile: false },
)
</script>

<template>
  <div class="learning-layout">
    <section class="learning-main">
      <header class="learning-head">
        <slot name="header" />
      </header>

      <slot name="before-sheet" />

      <div class="learning-sheet" :class="`learning-sheet--${sheetPadding}`">
        <slot />
      </div>

      <slot name="after-sheet" />

      <footer v-if="$slots.footer" class="learning-footer">
        <slot name="footer" />
      </footer>
    </section>

    <aside
      v-if="$slots.rail"
      class="learning-rail"
      :class="{ 'learning-rail--reverse-mobile': prioritizeRailEndOnMobile }"
      :aria-label="t('lesson.extras')"
    >
      <slot name="rail" />
    </aside>
  </div>
</template>

<style scoped>
.learning-layout {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
}

.learning-main {
  flex: 0 1 var(--learning-width);
  min-width: 0;
  max-width: var(--learning-width);
}

.learning-head {
  margin-bottom: var(--space-8);
}

.learning-sheet {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.learning-sheet--regular {
  padding: var(--space-12);
}

.learning-sheet--compact {
  padding: var(--space-8) var(--space-12);
}

.learning-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-12);
  padding-top: var(--space-8);
  border-top: 1px solid var(--border);
}

.learning-rail {
  position: sticky;
  top: var(--space-6);
  display: flex;
  flex: 1 1 var(--learning-rail-width);
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  height: calc(100dvh - var(--topbar) - var(--space-12));
}

@media (max-width: 1480px) {
  .learning-layout {
    display: block;
  }

  .learning-main {
    max-width: 100%;
  }

  .learning-rail {
    position: static;
    height: auto;
    margin-top: var(--space-12);
    --panel-grow: 0;
    --panel-height: var(--map-height);
  }
}

@media (max-width: 800px) {
  .learning-sheet--regular {
    padding: var(--space-6);
  }

  .learning-sheet--compact {
    padding: var(--space-6) var(--space-4);
  }

  .learning-rail {
    --panel-height: var(--map-height-compact);
  }

  .learning-rail--reverse-mobile {
    flex-direction: column-reverse;
  }
}

@media (max-width: 420px) {
  .learning-sheet--regular,
  .learning-sheet--compact {
    padding: var(--space-4);
  }
}
</style>

<script setup lang="ts">
import { LockKeyhole } from '@lucide/vue'
import { useRoute } from 'vue-router'

import SignInButton from '@/components/layout/SignInButton.vue'

/** Заглушка раздела для гостя: объясняет, что даст вход, вместо того чтобы сразу открывать окно. */
const props = defineProps<{ title: string; text: string; nextPath?: string }>()

const route = useRoute()
</script>

<template>
  <div class="gate">
    <span class="gate-icon" aria-hidden="true"><LockKeyhole :size="24" /></span>
    <h2 class="gate-title">{{ props.title }}</h2>
    <p class="gate-text">{{ props.text }}</p>
    <div class="gate-actions">
      <SignInButton :next-path="props.nextPath ?? route.fullPath" />
      <slot />
    </div>
  </div>
</template>

<style scoped>
.gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  max-width: 520px;
  /* Без auto-центрирования и своего верхнего отступа: у страниц разная ширина
     контейнера, а место под заголовком задаёт сама страница. */
  margin: 0;
  padding: var(--space-12) var(--space-8);
  text-align: center;
  background: radial-gradient(120% 80% at 50% 0%, var(--accent-soft), transparent 70%), var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.gate-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-2);
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-pill);
}

.gate-title {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
}

.gate-text {
  color: var(--text-muted);
  line-height: 1.5;
}

.gate-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

@media (max-width: 560px) {
  .gate {
    padding: var(--space-8) var(--space-4);
  }
}
</style>

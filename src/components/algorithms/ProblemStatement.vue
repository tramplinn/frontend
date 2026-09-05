<script setup lang="ts">
import type { AlgorithmProblem } from '@/api/schemas/algorithms'
import DifficultyChip from '@/components/algorithms/DifficultyChip.vue'
import { memoryLabel } from '@/lib/algorithms'

const props = defineProps<{ problem: AlgorithmProblem }>()
</script>

<template>
  <section class="statement">
    <header class="head">
      <h2>{{ props.problem.title }}</h2>
      <div class="meta">
        <DifficultyChip :difficulty="props.problem.difficulty" />
        <span v-for="tag in props.problem.tags" :key="tag.id" class="topic">{{ tag.name }}</span>
      </div>
      <p class="limits">
        {{ props.problem.timeLimitMs }} мс · {{ memoryLabel(props.problem.memoryLimitKb) }}
        <a
          v-if="props.problem.externalUrl"
          :href="props.problem.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="external"
        >
          условие у провайдера ↗
        </a>
      </p>
    </header>

    <!-- HTML санитизируется backend markdown renderer. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prose" v-html="props.problem.statementHtml" />

    <details v-for="sample in props.problem.samples" :key="sample.position" class="sample" open>
      <summary>пример {{ sample.position + 1 }}</summary>
      <div class="sample-body">
        <div>
          <span class="sample-label">ввод</span>
          <pre>{{ sample.input }}</pre>
        </div>
        <div>
          <span class="sample-label">вывод</span>
          <pre>{{ sample.expectedOutput }}</pre>
        </div>
      </div>
    </details>
  </section>
</template>

<style scoped>
.statement {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
  min-width: 0;
}

.head {
  margin-bottom: var(--space-4);
}

.head h2 {
  font-size: var(--text-title);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.limits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.external {
  color: var(--accent);
}

.sample {
  margin-top: var(--space-4);
}

.sample summary {
  color: var(--text-muted);
  font-size: var(--text-caption);
  cursor: pointer;
}

.sample-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.sample-label {
  color: var(--text-muted);
  font-size: var(--text-micro);
}

pre {
  overflow: auto;
  margin-top: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  white-space: pre-wrap;
}

@media (max-width: 560px) {
  .sample-body {
    grid-template-columns: 1fr;
  }
}
</style>

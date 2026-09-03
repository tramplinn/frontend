<script setup lang="ts">
import ProblemEditorPanel from '@/components/algorithms/ProblemEditorPanel.vue'
import ProblemStatement from '@/components/algorithms/ProblemStatement.vue'
import ReflectionPanel from '@/components/algorithms/ReflectionPanel.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useAlgorithmSolo } from '@/features/algorithms/composables/useAlgorithmSolo'

const props = defineProps<{ problem: string }>()
const { error, pending, runner, solved } = useAlgorithmSolo(() => props.problem)
</script>

<template>
  <LoadState :pending="pending" :error="error">
    <article class="solo">
      <header class="head">
        <RouterLink :to="{ name: 'algorithms' }" class="back">← ко всем задачам</RouterLink>
        <span v-if="solved" class="solved">решена</span>
      </header>

      <div v-if="runner.problem.value" class="workspace">
        <ProblemStatement :problem="runner.problem.value" />
        <div class="right">
          <ProblemEditorPanel :runner="runner" />
          <ReflectionPanel
            :progress="runner.progress.value"
            :saving="runner.savingReflection.value"
            @save="runner.saveReflection"
          />
        </div>
      </div>
    </article>
  </LoadState>
</template>

<style scoped>
.solo {
  display: grid;
  gap: var(--space-4);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.back {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.solved {
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--success-soft);
  color: var(--success);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(360px, 1.15fr);
  gap: var(--space-4);
  align-items: start;
  min-width: 0;
}

.right {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import AlgorithmChat from '@/components/algorithms/AlgorithmChat.vue'
import ProblemEditorPanel from '@/components/algorithms/ProblemEditorPanel.vue'
import ProblemStatement from '@/components/algorithms/ProblemStatement.vue'
import ReflectionPanel from '@/components/algorithms/ReflectionPanel.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useAlgorithmSolo } from '@/features/algorithms/composables/useAlgorithmSolo'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const auth = useAuthStore()

const props = defineProps<{ problem: string }>()
const { error, load, pending, runner, solved } = useAlgorithmSolo(() => props.problem)
</script>

<template>
  <LoadState :pending="pending" :error="error" @retry="load">
    <article class="solo">
      <header class="head">
        <BackLink :to="{ name: 'algorithms' }">{{ t('algorithms.toAll') }}</BackLink>
        <span v-if="solved" class="chip solved">{{ t('algorithms.solved') }}</span>
      </header>

      <div v-if="runner.problem.value" class="workspace">
        <ProblemStatement :problem="runner.problem.value" />
        <div class="right">
          <ProblemEditorPanel :runner="runner" />
          <ReflectionPanel
            v-if="auth.isAuthenticated"
            :runner="runner"
            @save="runner.saveReflection"
          />
        </div>
      </div>

      <AlgorithmChat v-if="runner.problem.value" :problem-id="runner.problem.value.id" />
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

.solved {
  background: var(--success-soft);
  color: var(--success);
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

<script setup lang="ts">
import { computed } from 'vue'

import type { ModuleDependency, ModuleTree } from '@/api/schemas/content'
import type { ModuleProgress } from '@/api/schemas/learning'
import ModuleGraphCanvas from './ModuleGraphCanvas.vue'
import { layoutGraph } from './graph'

const props = defineProps<{
  modules: ModuleTree[]
  dependencies: ModuleDependency[]
  progress: ModuleProgress[]
  selected: string | null
}>()

const emit = defineEmits<{ select: [moduleId: string] }>()

const layout = computed(() => layoutGraph(props.modules, props.dependencies))
</script>

<template>
  <div v-if="layout.nodes.length > 0" class="scroll">
    <ModuleGraphCanvas
      :layout="layout"
      :modules="props.modules"
      :progress="props.progress"
      :selected="props.selected"
      @select="(moduleId) => emit('select', moduleId)"
    />
  </div>
</template>

<style scoped>
.scroll {
  overflow-x: auto;
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0;
}
</style>

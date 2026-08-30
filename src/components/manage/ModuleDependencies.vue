<script setup lang="ts">
import { Label } from 'reka-ui'
import { computed, ref } from 'vue'

import { addModuleDependency, removeModuleDependency } from '@/api/authoring'
import type { ModuleDependency, ModuleTree } from '@/api/schemas/content'
import { ApiError } from '@/api/errors'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

const props = defineProps<{
  module: ModuleTree
  modules: ModuleTree[]
  dependencies: ModuleDependency[]
}>()

const emit = defineEmits<{ changed: [] }>()

const busy = ref<string | null>(null)
const error = ref<string | null>(null)

const required = computed(
  () =>
    new Set(
      props.dependencies
        .filter((edge) => edge.moduleId === props.module.id)
        .map((edge) => edge.dependsOnId),
    ),
)

const candidates = computed(() => props.modules.filter((item) => item.id !== props.module.id))

async function toggle(dependsOnId: string, checked: boolean): Promise<void> {
  busy.value = dependsOnId
  error.value = null
  try {
    if (checked) {
      await addModuleDependency(props.module.id, dependsOnId)
    } else {
      await removeModuleDependency(props.module.id, dependsOnId)
    }
    emit('changed')
  } catch (cause) {
    error.value =
      cause instanceof ApiError && cause.code === 'conflict'
        ? 'Так получился бы цикл: этот модуль уже зависит от текущего.'
        : 'Не удалось изменить связь.'
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="deps">
    <p class="title">нужно пройти до этого модуля</p>

    <p v-if="candidates.length === 0" class="empty">в курсе больше нет модулей</p>

    <div v-else class="list">
      <div v-for="item in candidates" :key="item.id" class="row">
        <AppCheckbox
          :id="`dep-${props.module.id}-${item.id}`"
          :model-value="required.has(item.id)"
          :disabled="busy === item.id"
          @update:model-value="(value) => toggle(item.id, value)"
        />
        <Label :for="`dep-${props.module.id}-${item.id}`" class="label">{{ item.title }}</Label>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.deps {
  padding: var(--space-4);
  background: var(--surface);
  border-radius: var(--radius-ctl);
}

.title {
  margin-bottom: var(--space-3);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-2);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.label {
  font-size: var(--text-caption);
  cursor: pointer;
}

.empty {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.error {
  margin-top: var(--space-3);
  color: var(--danger);
  font-size: var(--text-caption);
}
</style>

<script setup lang="ts">
import type { ModuleDraft } from '@/api/authoring'
import type { ModuleDependency, ModuleItem, ModuleTree } from '@/api/schemas/content'
import InlineCreate from '@/components/manage/InlineCreate.vue'
import ModuleDependencies from '@/components/manage/ModuleDependencies.vue'
import ModuleEditor from '@/components/manage/ModuleEditor.vue'
import ModuleItemRow from '@/components/manage/ModuleItemRow.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import {
  contentStatusAction,
  isPublishedModuleEmpty,
  publishedItemCount,
} from '@/features/content/model/contentTree'

const props = defineProps<{
  module: ModuleTree
  modules: ModuleTree[]
  dependencies: ModuleDependency[]
  busy: boolean
  first: boolean
  last: boolean
  editing: boolean
  /** Открытый модуль догружается отдельно: связи есть только у него. */
  expanded: ModuleTree | null
  depsOpen: boolean
}>()

const emit = defineEmits<{
  edit: []
  save: [changes: Partial<ModuleDraft>]
  cancelEdit: []
  toggleDeps: []
  depsChanged: []
  publish: []
  move: [delta: number]
  remove: []
  addLesson: [draft: { title: string; slug: string }]
  addQuiz: [draft: { title: string; slug: string }]
  moveItem: [index: number, delta: number]
  removeItem: [item: ModuleItem]
}>()
</script>

<template>
  <div class="module">
    <div class="module-head">
      <span class="module-title">{{ props.module.title }}</span>
      <StatusChip :status="props.module.status" />
      <span
        v-if="isPublishedModuleEmpty(props.module)"
        class="warn-chip"
        title="Все уроки и тесты модуля — черновики"
      >
        не видно студентам
      </span>
      <span class="module-meta">
        {{ publishedItemCount(props.module) }} из {{ props.module.items.length }} опубликовано
      </span>
      <RowMenu class="actions" :disabled="props.busy" :label="`Действия: ${props.module.title}`">
        <RowMenuItem @select="emit('edit')">изменить модуль</RowMenuItem>
        <RowMenuItem @select="emit('toggleDeps')">связи модуля</RowMenuItem>
        <RowMenuItem @select="emit('publish')">
          {{ contentStatusAction(props.module.status) }}
        </RowMenuItem>
        <RowMenuItem :disabled="props.first" @select="emit('move', -1)">выше</RowMenuItem>
        <RowMenuItem :disabled="props.last" @select="emit('move', 1)">ниже</RowMenuItem>
        <RowMenuItem danger @select="emit('remove')">удалить модуль</RowMenuItem>
      </RowMenu>
    </div>

    <div class="module-body">
      <ModuleEditor
        v-if="props.editing"
        :module="props.module"
        :busy="props.busy"
        @save="(changes) => emit('save', changes)"
        @cancel="emit('cancelEdit')"
      />

      <ModuleDependencies
        v-if="props.depsOpen && props.expanded"
        :module="props.expanded"
        :modules="props.modules"
        :dependencies="props.dependencies"
        @changed="emit('depsChanged')"
      />

      <ul class="items">
        <ModuleItemRow
          v-for="(item, itemIndex) in props.module.items"
          :key="item.id"
          :item="item"
          :busy="props.busy"
          :first="itemIndex === 0"
          :last="itemIndex === props.module.items.length - 1"
          @move="(delta) => emit('moveItem', itemIndex, delta)"
          @remove="emit('removeItem', item)"
        />
      </ul>

      <div class="module-add">
        <InlineCreate
          label="урок"
          placeholder="название урока"
          :saving="props.busy"
          @create="(draft) => emit('addLesson', draft)"
        />
        <InlineCreate
          label="тест"
          placeholder="название теста"
          :saving="props.busy"
          @create="(draft) => emit('addQuiz', draft)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}

.module-title {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
}

.module-body {
  padding-left: var(--space-4);
  margin: var(--space-2) 0 0 var(--space-4);
  border-left: 1px solid var(--border);
}

.module-meta {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.module-add {
  display: flex;
  gap: var(--space-2);
  padding-top: var(--space-1);
}

.actions {
  margin-left: auto;
}

.items {
  list-style: none;
}

.warn-chip {
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--warning-soft);
  color: var(--warning);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}
</style>

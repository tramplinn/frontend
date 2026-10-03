<script setup lang="ts">
import { ArrowDown, ArrowUp, GripVertical } from '@lucide/vue'
import { onMounted } from 'vue'

import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useProfileLayoutEditor } from '@/features/projects/composables/useProfileLayoutEditor'
import { useI18n } from '@/i18n'
import { profileBlockLabel } from '@/lib/projects'

const { t } = useI18n()
const emit = defineEmits<{ saved: [] }>()

const editor = useProfileLayoutEditor(() => {
  emit('saved')
})
const { blocks, projects, pending, loadError, saving, error, saved, blockOrder, projectOrder } =
  editor

onMounted(() => void editor.load())
</script>

<template>
  <section class="card layout">
    <header>
      <p>{{ t('profile.public') }}</p>
      <h2>{{ t('profileLayout.heading') }}</h2>
    </header>
    <LoadState :pending="pending" :error="loadError" @retry="editor.load">
      <h3>{{ t('profileLayout.blocks') }}</h3>
      <ol class="rows">
        <li
          v-for="(item, index) in blocks"
          :key="item.block"
          class="row"
          :class="{ 'row--dragging': blockOrder.dragging.value === index }"
          draggable="true"
          @dragstart="blockOrder.onDragStart(index, $event)"
          @dragover="blockOrder.onDragOver"
          @drop="blockOrder.onDrop(index)"
          @dragend="blockOrder.onDragEnd"
        >
          <GripVertical :size="16" class="grip" aria-hidden="true" />
          <AppCheckbox
            :id="`profile-block-${item.block}`"
            :model-value="item.visible"
            @update:model-value="editor.toggleBlock(index)"
          />
          <label :for="`profile-block-${item.block}`" class="name">{{
            profileBlockLabel(item.block)
          }}</label>
          <span class="buttons">
            <AppButton
              size="sm"
              variant="quiet"
              :disabled="index === 0"
              :aria-label="t('projects.moveUp')"
              @click="blockOrder.move(index, index - 1)"
              ><ArrowUp :size="14"
            /></AppButton>
            <AppButton
              size="sm"
              variant="quiet"
              :disabled="index === blocks.length - 1"
              :aria-label="t('projects.moveDown')"
              @click="blockOrder.move(index, index + 1)"
              ><ArrowDown :size="14"
            /></AppButton>
          </span>
        </li>
      </ol>

      <h3>{{ t('profileLayout.projects') }}</h3>
      <p v-if="projects.length === 0" class="hint">{{ t('profileLayout.noProjects') }}</p>
      <ol v-else class="rows">
        <li
          v-for="(row, index) in projects"
          :key="row.project.id"
          class="row"
          :class="{ 'row--dragging': projectOrder.dragging.value === index }"
          draggable="true"
          @dragstart="projectOrder.onDragStart(index, $event)"
          @dragover="projectOrder.onDragOver"
          @drop="projectOrder.onDrop(index)"
          @dragend="projectOrder.onDragEnd"
        >
          <GripVertical :size="16" class="grip" aria-hidden="true" />
          <AppCheckbox
            :id="`profile-project-${row.project.id}`"
            :model-value="row.showInProfile"
            @update:model-value="editor.toggleProject(index)"
          />
          <label :for="`profile-project-${row.project.id}`" class="name">{{
            row.project.title
          }}</label>
          <ProjectStatusBadge :status="row.project.status" />
          <span class="buttons">
            <AppButton
              size="sm"
              variant="quiet"
              :disabled="index === 0"
              :aria-label="t('projects.moveUp')"
              @click="projectOrder.move(index, index - 1)"
              ><ArrowUp :size="14"
            /></AppButton>
            <AppButton
              size="sm"
              variant="quiet"
              :disabled="index === projects.length - 1"
              :aria-label="t('projects.moveDown')"
              @click="projectOrder.move(index, index + 1)"
              ><ArrowDown :size="14"
            /></AppButton>
          </span>
        </li>
      </ol>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else-if="saved" class="saved" role="status">{{ saved }}</p>
      <div class="actions">
        <AppButton variant="primary" :loading="saving" @click="editor.save">{{
          t('profileLayout.save')
        }}</AppButton>
      </div>
    </LoadState>
  </section>
</template>

<style scoped>
.card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--card);
}
header {
  margin-bottom: var(--space-4);
}
header p {
  color: var(--accent);
  font-size: var(--text-caption);
}
header h2 {
  font-size: var(--text-title);
}
h3 {
  margin: var(--space-4) 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
.rows {
  display: grid;
  gap: var(--space-1);
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}
.row--dragging {
  opacity: 0.5;
}
.grip {
  flex: 0 0 auto;
  color: var(--text-muted);
  cursor: grab;
}
.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.buttons {
  display: flex;
  gap: var(--space-1);
}
.hint {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.error {
  margin-top: var(--space-3);
  color: var(--danger);
  font-size: var(--text-caption);
}
.saved {
  margin-top: var(--space-3);
  color: var(--success);
  font-size: var(--text-caption);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
@media (max-width: 520px) {
  .card {
    padding: var(--space-4);
  }
}
</style>

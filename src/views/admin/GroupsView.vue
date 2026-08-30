<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { createGroup, deleteGroup, listGroups, updateGroup } from '@/api/admin'
import type { StudentGroup } from '@/api/schemas/admin'
import AppButton from '@/components/ui/AppButton.vue'
import LoadState from '@/components/ui/LoadState.vue'
import RowMenu from '@/components/ui/RowMenu.vue'
import RowMenuItem from '@/components/ui/RowMenuItem.vue'
import { errorText } from '@/lib/errors'

const groups = ref<StudentGroup[]>([])
const pending = ref(true)
const error = ref<unknown>(null)
const actionError = ref<unknown>(null)
const saving = ref(false)

const draftName = ref('')
const draftYear = ref(new Date().getFullYear())

const editingId = ref<string | null>(null)
const editName = ref('')
const editYear = ref(0)

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    groups.value = await listGroups()
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

async function submit(): Promise<void> {
  if (!draftName.value.trim()) {
    return
  }
  saving.value = true
  actionError.value = null
  try {
    const created = await createGroup(draftName.value.trim(), draftYear.value)
    groups.value = [...groups.value, created]
    draftName.value = ''
  } catch (cause) {
    actionError.value = cause
  } finally {
    saving.value = false
  }
}

function startEdit(group: StudentGroup): void {
  editingId.value = group.id
  editName.value = group.name
  editYear.value = group.year
}

async function commitEdit(): Promise<void> {
  const id = editingId.value
  if (id === null) {
    return
  }
  saving.value = true
  actionError.value = null
  try {
    const updated = await updateGroup(id, { name: editName.value.trim(), year: editYear.value })
    groups.value = groups.value.map((group) => (group.id === id ? updated : group))
    editingId.value = null
  } catch (cause) {
    actionError.value = cause
  } finally {
    saving.value = false
  }
}

async function remove(group: StudentGroup): Promise<void> {
  saving.value = true
  actionError.value = null
  try {
    await deleteGroup(group.id)
    groups.value = groups.value.filter((item) => item.id !== group.id)
  } catch (cause) {
    actionError.value = cause
  } finally {
    saving.value = false
  }
}

onMounted(() => void load())
</script>

<template>
  <section>
    <h1 class="heading">группы</h1>
    <p class="lede">Учебные группы колледжа. У студента может быть только одна.</p>

    <form class="new" @submit.prevent="submit">
      <input
        v-model="draftName"
        class="text-field"
        placeholder="название, например ИСП-21"
        required
      />
      <input
        v-model.number="draftYear"
        class="text-field input--year"
        type="number"
        min="2000"
        max="9999"
        aria-label="Год набора"
        required
      />
      <AppButton type="submit" variant="primary" size="sm" :loading="saving">добавить</AppButton>
    </form>

    <p v-if="actionError" class="action-error" role="alert">{{ errorText(actionError) }}</p>

    <LoadState :pending="pending" :error="error">
      <p v-if="groups.length === 0" class="empty">групп пока нет</p>

      <ul v-else class="list">
        <li v-for="group in groups" :key="group.id" class="row">
          <template v-if="editingId === group.id">
            <input v-model="editName" class="text-field" aria-label="Название группы" />
            <input
              v-model.number="editYear"
              class="text-field input--year"
              type="number"
              min="2000"
              max="9999"
              aria-label="Год набора"
            />
            <div class="actions">
              <AppButton size="sm" variant="primary" :loading="saving" @click="commitEdit">
                сохранить
              </AppButton>
              <AppButton size="sm" variant="quiet" @click="editingId = null">отмена</AppButton>
            </div>
          </template>

          <template v-else>
            <span class="row-name">{{ group.name }}</span>
            <span class="row-year">{{ group.year }}</span>
            <RowMenu class="actions" :disabled="saving" :label="`Действия: ${group.name}`">
              <RowMenuItem @select="startEdit(group)">изменить</RowMenuItem>
              <RowMenuItem danger @select="remove(group)">удалить группу</RowMenuItem>
            </RowMenu>
          </template>
        </li>
      </ul>
    </LoadState>
  </section>
</template>

<style scoped>
.heading {
  font-size: var(--text-hero);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.03em;
}

.lede {
  max-width: var(--measure);
  margin: var(--space-1) 0 var(--space-6);
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.new {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.input--year {
  width: 96px;
}

.action-error {
  margin-bottom: var(--space-4);
  color: var(--danger);
  font-size: var(--text-caption);
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

.row-name {
  font-weight: var(--weight-medium);
}

.row-year {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.empty {
  padding: var(--space-12) 0;
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>

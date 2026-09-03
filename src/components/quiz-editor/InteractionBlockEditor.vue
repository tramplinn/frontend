<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ type: 'matching' | 'grouping'; lines: string[] }>()
const emit = defineEmits<{ change: [lines: string[]] }>()

interface Pair {
  left: string
  right: string
}
interface Group {
  name: string
  items: string[]
}

function splitOnce(value: string, separator: string): Pair {
  const at = value.indexOf(separator)
  return at < 0
    ? { left: value.trim(), right: '' }
    : { left: value.slice(0, at).trim(), right: value.slice(at + 1).trim() }
}

const pairs = computed(() => props.lines.map((line) => splitOnce(line, '=')))
const groups = computed<Group[]>(() =>
  props.lines.map((line) => {
    const parsed = splitOnce(line, ':')
    return {
      name: parsed.left,
      items: parsed.right
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }
  }),
)

function writePairs(next: Pair[]): void {
  emit(
    'change',
    next.map((pair) => `${pair.left} = ${pair.right}`),
  )
}

function setPair(index: number, side: keyof Pair, value: string): void {
  writePairs(pairs.value.map((pair, at) => (at === index ? { ...pair, [side]: value } : pair)))
}

function writeGroups(next: Group[]): void {
  emit(
    'change',
    next.map((group) => `${group.name}: ${group.items.join(', ')}`),
  )
}

function setGroup(index: number, name: string): void {
  writeGroups(groups.value.map((group, at) => (at === index ? { ...group, name } : group)))
}

function setItem(groupIndex: number, itemIndex: number, value: string): void {
  writeGroups(
    groups.value.map((group, at) =>
      at === groupIndex
        ? {
            ...group,
            items: group.items.map((item, itemAt) => (itemAt === itemIndex ? value : item)),
          }
        : group,
    ),
  )
}

function addItem(groupIndex: number): void {
  writeGroups(
    groups.value.map((group, at) =>
      at === groupIndex ? { ...group, items: [...group.items, 'Новый элемент'] } : group,
    ),
  )
}

function removeItem(groupIndex: number, itemIndex: number): void {
  writeGroups(
    groups.value.map((group, at) =>
      at === groupIndex
        ? { ...group, items: group.items.filter((_, itemAt) => itemAt !== itemIndex) }
        : group,
    ),
  )
}
</script>

<template>
  <div class="interaction-editor">
    <div class="intro">
      <span>{{ type === 'matching' ? 'пары для связывания' : 'категории и элементы' }}</span>
      <small>студент увидит их перемешанными</small>
    </div>

    <template v-if="type === 'matching'">
      <div v-for="(pair, index) in pairs" :key="index" class="pair-row">
        <label
          ><span>понятие</span
          ><input
            :value="pair.left"
            @input="setPair(index, 'left', ($event.target as HTMLInputElement).value)"
        /></label>
        <span class="pair-arrow" aria-hidden="true">→</span>
        <label
          ><span>соответствие</span
          ><input
            :value="pair.right"
            @input="setPair(index, 'right', ($event.target as HTMLInputElement).value)"
        /></label>
        <AppButton
          size="sm"
          variant="quiet"
          @click="writePairs(pairs.filter((_, at) => at !== index))"
          >убрать</AppButton
        >
      </div>
      <AppButton
        size="sm"
        variant="quiet"
        @click="writePairs([...pairs, { left: 'Новое понятие', right: 'Соответствие' }])"
        >+ пара</AppButton
      >
    </template>

    <template v-else>
      <article v-for="(group, groupIndex) in groups" :key="groupIndex" class="group-card">
        <div class="group-head">
          <label
            ><span>название блока</span
            ><input
              :value="group.name"
              @input="setGroup(groupIndex, ($event.target as HTMLInputElement).value)"
          /></label>
          <AppButton
            size="sm"
            variant="quiet"
            @click="writeGroups(groups.filter((_, at) => at !== groupIndex))"
            >убрать блок</AppButton
          >
        </div>
        <div class="items">
          <div v-for="(item, itemIndex) in group.items" :key="itemIndex" class="item-row">
            <span class="grip" aria-hidden="true">·</span>
            <input
              :value="item"
              :aria-label="`Элемент блока ${group.name}`"
              @input="setItem(groupIndex, itemIndex, ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              aria-label="Убрать элемент"
              @click="removeItem(groupIndex, itemIndex)"
            >
              ×
            </button>
          </div>
          <AppButton size="sm" variant="quiet" @click="addItem(groupIndex)">+ элемент</AppButton>
        </div>
      </article>
      <AppButton
        size="sm"
        variant="quiet"
        @click="writeGroups([...groups, { name: 'Новый блок', items: ['Новый элемент'] }])"
        >+ блок</AppButton
      >
    </template>
  </div>
</template>

<style scoped>
.interaction-editor {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding-left: var(--space-8);
}
.intro {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}
.intro span,
label span {
  color: var(--text-muted);
  font-size: var(--text-caption);
}
.intro small {
  color: var(--text-muted);
  font-size: var(--text-micro);
}
.pair-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--surface);
}
label {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}
input {
  width: 100%;
  height: var(--ctl-sm);
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--card);
}
input:focus {
  border-color: var(--accent);
  outline: none;
}
.pair-arrow {
  align-self: center;
  color: var(--accent);
}
.group-card {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}
.group-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface);
}
.group-head label {
  flex: 1;
}
.items {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
}
.item-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.grip {
  color: var(--text-muted);
  font-size: var(--text-title);
}
.item-row input {
  flex: 1;
}
.item-row button {
  width: var(--ctl-sm);
  height: var(--ctl-sm);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.item-row button:hover {
  background: var(--surface);
  color: var(--danger);
}
@media (max-width: 680px) {
  .interaction-editor {
    padding-left: 0;
  }
  .pair-row {
    grid-template-columns: 1fr auto;
  }
  .pair-arrow {
    display: none;
  }
  .pair-row > label {
    grid-column: 1 / -1;
  }
  .intro {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
  }
}
</style>

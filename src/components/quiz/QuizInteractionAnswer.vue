<script setup lang="ts">
import { ref } from 'vue'

import type { QuizQuestion } from '@/api/schemas/content'
import {
  groupedItems,
  interactionAnswer,
  interactiveOptions,
  matchingLabel,
  placeGrouping,
  placeMatching,
  type PlacementMap,
  unplacedItems,
} from '@/features/quiz-runner/model/interactions'

const props = defineProps<{ question: QuizQuestion; reviewing: boolean }>()
const emit = defineEmits<{ answer: [value: unknown] }>()

const placements = ref<PlacementMap>({})
const draggedItemId = ref<string | null>(null)

function select(itemId: string): void {
  if (!props.reviewing) draggedItemId.value = itemId
}

function place(targetId: string): void {
  const itemId = draggedItemId.value
  if (!itemId || props.reviewing) return
  if (props.question.type === 'matching') {
    placements.value = placeMatching(placements.value, itemId, targetId)
    emit('answer', interactionAnswer('matching', placements.value))
  } else if (props.question.type === 'grouping') {
    placements.value = placeGrouping(placements.value, itemId, targetId)
    emit('answer', interactionAnswer('grouping', placements.value))
  }
  draggedItemId.value = null
}
</script>

<template>
  <div class="interaction">
    <div class="token-pool">
      <button
        v-for="item in unplacedItems(
          question,
          placements,
          question.type === 'matching' ? 'right' : 'item',
        )"
        :key="item.id"
        type="button"
        class="drag-token"
        :class="{ 'drag-token--selected': draggedItemId === item.id }"
        :draggable="!reviewing"
        :disabled="reviewing"
        @dragstart="select(item.id)"
        @click="select(item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <template v-if="question.type === 'matching'">
      <div v-for="left in interactiveOptions(question, 'left')" :key="left.id" class="match-row">
        <span>{{ left.label }}</span>
        <button
          type="button"
          class="drop-zone"
          :disabled="reviewing"
          @dragover.prevent
          @drop.prevent="place(left.id)"
          @click="place(left.id)"
        >
          {{ matchingLabel(question, placements, left.id) ?? 'выберите соответствие' }}
        </button>
      </div>
    </template>

    <div v-else class="group-grid">
      <section
        v-for="group in interactiveOptions(question, 'group')"
        :key="group.id"
        class="group-zone"
        role="button"
        :aria-label="`Поместить выбранный элемент в группу ${group.label}`"
        :tabindex="reviewing ? -1 : 0"
        @dragover.prevent
        @drop.prevent="place(group.id)"
        @click="place(group.id)"
        @keydown.enter.prevent="place(group.id)"
      >
        <strong>{{ group.label }}</strong>
        <button
          v-for="item in groupedItems(question, placements, group.id)"
          :key="item.id"
          type="button"
          class="drag-token"
          :class="{ 'drag-token--selected': draggedItemId === item.id }"
          :draggable="!reviewing"
          :disabled="reviewing"
          @dragstart.stop="select(item.id)"
          @click.stop="select(item.id)"
        >
          {{ item.label }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.interaction {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-left: var(--space-8);
}

.token-pool,
.group-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.drag-token,
.drop-zone,
.group-zone {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-ctl);
  background: var(--surface);
  color: inherit;
  text-align: left;
}

.drag-token {
  cursor: grab;
}

.drag-token--selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.match-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 1fr);
  align-items: center;
  gap: var(--space-3);
}

.drop-zone {
  min-height: var(--ctl-md);
  color: var(--text-muted);
  cursor: pointer;
}

.group-zone {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 120px;
  cursor: pointer;
}

.drag-token:disabled,
.drop-zone:disabled,
.group-zone[tabindex='-1'] {
  cursor: default;
}

@media (max-width: 620px) {
  .interaction {
    margin-left: 0;
  }

  .match-row {
    grid-template-columns: 1fr;
  }

  .group-zone {
    flex-basis: 100%;
    min-height: calc(var(--ctl-md) * 2);
  }
}
</style>

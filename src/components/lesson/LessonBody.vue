<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{ html: string }>()

const container = ref<HTMLElement | null>(null)

function upgradeSpoilers(): void {
  const root = container.value
  if (!root) {
    return
  }
  for (const block of root.querySelectorAll('div.spoiler')) {
    const details = document.createElement('details')
    details.className = 'spoiler'
    const summary = document.createElement('summary')
    summary.textContent = 'показать'
    details.append(summary)
    while (block.firstChild) {
      details.append(block.firstChild)
    }
    block.replaceWith(details)
  }
}

onMounted(upgradeSpoilers)
watch(
  () => props.html,
  () => void nextTick(upgradeSpoilers),
)
</script>

<template>
  <!-- body_html — серверный рендер markdown с html=false: сырой HTML из исходника
       экранируется на бэкенде, поэтому v-html здесь безопасен. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="container" class="prose" v-html="props.html" />
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import { useI18n } from '@/i18n'

const { locale, t } = useI18n()

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
    details.append(summary)
    while (block.firstChild) {
      details.append(block.firstChild)
    }
    block.replaceWith(details)
  }
  for (const summary of root.querySelectorAll('details.spoiler > summary')) {
    summary.textContent = t('lesson.showSpoiler')
  }
}

onMounted(upgradeSpoilers)
watch(
  () => [props.html, locale.value],
  () => void nextTick(upgradeSpoilers),
)
</script>

<template>
  <!-- body_html — серверный рендер markdown с html=false: сырой HTML из исходника
       экранируется на бэкенде, поэтому v-html здесь безопасен. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="container" class="prose" v-html="props.html" />
</template>

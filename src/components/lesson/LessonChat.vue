<script setup lang="ts">
import { askTutor } from '@/api/tutor'
import TutorChatPanel from '@/components/tutor/TutorChatPanel.vue'

const props = defineProps<{ lessonId: string }>()
</script>

<template>
  <TutorChatPanel kind="lesson" :content-id="props.lessonId" :ask="askTutor" />
</template>

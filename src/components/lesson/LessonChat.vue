<script setup lang="ts">
import { askTutor } from '@/api/tutor'
import TutorChatPanel from '@/features/tutor/components/TutorChatPanel.vue'

const props = defineProps<{ lessonId: string }>()
</script>

<template>
  <TutorChatPanel kind="lesson" :content-id="props.lessonId" :ask="askTutor" />
</template>

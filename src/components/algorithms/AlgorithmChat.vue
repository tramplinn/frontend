<script setup lang="ts">
import { askProblemTutor } from '@/api/tutor'
import TutorChatPanel from '@/components/tutor/TutorChatPanel.vue'

const props = defineProps<{ problemId: string }>()
</script>

<template>
  <TutorChatPanel kind="problem" :content-id="props.problemId" :ask="askProblemTutor" />
</template>

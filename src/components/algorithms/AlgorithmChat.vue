<script setup lang="ts">
import { askProblemTutor } from '@/api/tutor'
import TutorChatPanel from '@/features/tutor/components/TutorChatPanel.vue'

const props = defineProps<{ problemId: string }>()
</script>

<template>
  <TutorChatPanel kind="problem" :content-id="props.problemId" :ask="askProblemTutor" />
</template>

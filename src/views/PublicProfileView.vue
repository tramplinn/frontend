<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import type { PublicProfile } from '@/api/schemas/users'
import { getPublicProfile } from '@/api/users'
import ProfileSummary from '@/components/profile/ProfileSummary.vue'
import LoadState from '@/components/ui/LoadState.vue'

const props = defineProps<{ login: string }>()
const profile = ref<PublicProfile | null>(null)
const pending = ref(true)
const error = ref<unknown>(null)

async function load(): Promise<void> {
  pending.value = true
  error.value = null
  try {
    profile.value = await getPublicProfile(props.login)
  } catch (cause) {
    error.value = cause
  } finally {
    pending.value = false
  }
}

onMounted(() => void load())
watch(
  () => props.login,
  () => void load(),
)
</script>

<template>
  <LoadState :pending="pending" :error="error"
    ><ProfileSummary v-if="profile" :profile="profile"
  /></LoadState>
</template>

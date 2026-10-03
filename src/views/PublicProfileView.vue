<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import type { PublicProfile } from '@/api/schemas/users'
import { getPublicProfile } from '@/api/users'
import SignInGate from '@/components/layout/SignInGate.vue'
import ProfileSummary from '@/components/profile/ProfileSummary.vue'
import BackLink from '@/components/ui/BackLink.vue'
import LoadState from '@/components/ui/LoadState.vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const auth = useAuthStore()

const props = defineProps<{ login: string }>()
const profile = ref<PublicProfile | null>(null)
const pending = ref(true)
const error = ref<unknown>(null)

async function load(): Promise<void> {
  if (!auth.isAuthenticated) return
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
  () => [props.login, auth.isAuthenticated],
  () => void load(),
)
</script>

<template>
  <BackLink :to="{ name: 'people' }" class="back">{{ t('people.back') }}</BackLink>
  <SignInGate
    v-if="!auth.isAuthenticated"
    :title="t('people.gateTitle')"
    :text="t('people.gateText')"
  />
  <LoadState v-else :pending="pending" :error="error" @retry="load"
    ><ProfileSummary v-if="profile" :profile="profile"
  /></LoadState>
</template>

<style scoped>
.back {
  display: inline-flex;
  margin-bottom: var(--space-6);
}
</style>

<script setup lang="ts">
import type { PublicProfile } from '@/api/schemas/users'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <a
    v-if="profile.resumeUrl"
    :href="profile.resumeUrl"
    target="_blank"
    rel="noopener"
    class="resume-link"
    >{{ t('profile.resumePdf') }}</a
  >
</template>

<style scoped>
.resume-link {
  display: inline-flex;
  width: fit-content;
  color: var(--accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
}
.resume-link:hover {
  text-decoration: underline;
}
</style>

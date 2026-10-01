<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useRouter } from 'vue-router'

import { useI18n } from '@/i18n'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <section class="wrap">
    <h1 class="title">{{ t('notFound.title') }}</h1>
    <AppButton variant="primary" @click="router.push({ name: 'home' })">{{
      t('notFound.toCourses')
    }}</AppButton>
  </section>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-6);
  padding: var(--space-12) 0;
}

.title {
  font-size: var(--text-title);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}
</style>

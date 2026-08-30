<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <section class="wrap">
    <h1 class="title">страница не найдена</h1>
    <AppButton variant="primary" @click="router.push({ name: 'home' })">к курсам</AppButton>
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

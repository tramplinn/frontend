<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="content">
      <AppHeader />
      <main class="main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  align-items: flex-start;
  min-height: 100dvh;
}

.content {
  flex: 1;
  min-width: 0;
  max-width: 1600px;
  margin-inline: auto;
}

.main {
  padding: var(--space-6) var(--space-8) var(--space-12);
}

@media (max-width: 800px) {
  .shell {
    flex-direction: column;
  }

  .main {
    padding: var(--space-4);
  }
}
</style>

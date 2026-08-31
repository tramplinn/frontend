<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">к содержанию</a>
  <div class="shell">
    <AppSidebar />
    <div class="content">
      <AppHeader />
      <main id="main-content" class="main" tabindex="-1">
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

.skip-link {
  position: fixed;
  z-index: 100;
  top: var(--space-2);
  left: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-ctl);
  background: var(--selected);
  color: var(--on-selected);
  font-size: var(--text-caption);
  transform: translateY(calc(-100% - var(--space-4)));
}

.skip-link:focus {
  transform: translateY(0);
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

  .content {
    width: 100%;
  }

  .main {
    padding: var(--space-4);
  }
}
</style>

<script setup lang="ts">
import type { SectionKey } from '@/lib/sections'

defineProps<{ name: SectionKey }>()
</script>

<template>
  <span class="icon" aria-hidden="true">
    <svg v-if="name === 'learning'" viewBox="0 0 20 20">
      <circle class="soft-purple" cx="10" cy="10" r="8" />
      <path class="purple" d="M8 6.7 13.2 10 8 13.3Z" />
      <circle class="warning" cx="15.5" cy="4.5" r="2" />
    </svg>

    <svg v-else-if="name === 'catalog'" viewBox="0 0 20 20">
      <rect class="accent" x="3" y="3" width="4" height="14" rx="1.5" />
      <rect class="cyan" x="8" y="5" width="4" height="12" rx="1.5" />
      <path class="warning" d="m13.2 4.6 3.3-.9 3.1 11.7-3.3.9z" />
    </svg>

    <svg v-else-if="name === 'algorithms'" viewBox="0 0 20 20">
      <rect class="soft-cyan" x="2" y="3" width="16" height="14" rx="3" />
      <path class="cyan" d="M5.6 6.9 9.4 10l-3.8 3.1-1.1-1.4L6.9 10 4.5 8.3z" />
      <rect class="warning" x="10.4" y="12.2" width="5.2" height="1.8" rx="0.9" />
    </svg>

    <svg v-else-if="name === 'content'" viewBox="0 0 20 20">
      <path class="purple" d="M4 2.5h8l3.5 3.6v11.4H4z" />
      <path class="soft-purple" d="M12 2.5v4h3.5z" />
      <path class="warning" d="m8.1 14.8.7-3 5.4-5.4 2.3 2.3-5.4 5.4z" />
    </svg>

    <svg v-else-if="name === 'algorithm-library'" viewBox="0 0 20 20">
      <rect class="soft-purple" x="3" y="2.5" width="14" height="15" rx="2.5" />
      <rect class="purple" x="5.6" y="5.6" width="6" height="1.6" rx="0.8" />
      <rect class="purple" x="5.6" y="8.7" width="8.8" height="1.6" rx="0.8" />
      <path class="success" d="m6.2 13.7 1.4-1.4 1.4 1.4 3.4-3.4 1.4 1.4-4.8 4.8z" />
    </svg>

    <svg v-else-if="name === 'assets'" viewBox="0 0 20 20">
      <rect class="soft-cyan" x="2" y="3" width="16" height="14" rx="3" />
      <circle class="warning" cx="13.8" cy="7.2" r="2" />
      <path class="cyan" d="m3.8 15 4.1-4.5 2.7 2.7 1.8-1.8 3.8 3.6z" />
    </svg>

    <svg v-else-if="name === 'users'" viewBox="0 0 20 20">
      <circle class="accent" cx="7" cy="6.5" r="3" />
      <circle class="purple" cx="14.2" cy="7.5" r="2.5" />
      <path class="cyan" d="M1.8 17c.3-4 2.1-6 5.2-6s4.9 2 5.2 6z" />
      <path class="soft-purple" d="M11.3 17c.2-3.1 1.3-4.7 3.3-4.7s3.2 1.6 3.6 4.7z" />
    </svg>

    <svg v-else viewBox="0 0 20 20">
      <circle class="success" cx="6" cy="6" r="3" />
      <circle class="accent" cx="14" cy="6" r="3" />
      <circle class="purple" cx="10" cy="13.5" r="3.5" />
      <path class="warning" d="M2 17c.2-2.8 1.6-4.2 4-4.2S9.8 14.2 10 17z" />
      <path class="soft-cyan" d="M10 17c.2-2.8 1.6-4.2 4-4.2s3.8 1.4 4 4.2z" />
    </svg>
  </span>
</template>

<style scoped>
.icon,
svg {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
}

.accent {
  fill: var(--accent);
}

.cyan {
  fill: var(--icon-cyan);
}

.soft-cyan {
  fill: var(--icon-cyan-soft);
}

.purple {
  fill: var(--icon-purple);
}

.soft-purple {
  fill: var(--icon-purple-soft);
}

.success {
  fill: var(--success);
}

.warning {
  fill: var(--warning);
}
</style>

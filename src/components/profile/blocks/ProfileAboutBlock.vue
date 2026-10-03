<script setup lang="ts">
import type { PublicProfile } from '@/api/schemas/users'

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <div class="about">
    <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
    <ul v-if="profile.interests.length" class="interests">
      <li v-for="interest in profile.interests" :key="interest.id">{{ interest.name }}</li>
    </ul>
  </div>
</template>

<style scoped>
.about {
  display: grid;
  gap: var(--space-4);
}
.bio {
  max-width: var(--measure);
  white-space: pre-line;
}
.interests {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
}
.interests li {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-size: var(--text-caption);
}
</style>
